const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const JSZip = require("jszip");
const xlsx = require("node-xlsx").default;
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const { containsSpecialCharacters, normalizeText } = require("../../common/utils");

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const execFileAsync = promisify(execFile);

// Digest workbooks are expected to be small. These ceilings allow large real-world
// workbooks while rejecting archives that could exhaust memory during ZIP/XML parsing.
const DEFAULT_LIMITS = Object.freeze({
  maxSourceBytes: 100 * 1024 * 1024,
  maxEntryCount: 2048,
  maxEntryUncompressedBytes: 32 * 1024 * 1024,
  maxTotalUncompressedBytes: 256 * 1024 * 1024,
  maxCompressionRatio: 200,
  maxXmlBytes: 16 * 1024 * 1024,
});

const SUPPORTED_ESCAPES = new Map([
  [0x0009, " "],
  [0x00A0, " "],
  [0x200B, ""],
  [0x2013, "-"],
  [0x2019, "'"],
]);

const parseXml = (xml, entryName) => {
  const failures = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") failures.push(message);
    },
  }).parseFromString(xml, "application/xml");
  if (!document || !document.documentElement || failures.length > 0) {
    throw new Error(`Invalid XML in ${entryName}: ${failures.join("; ") || "missing root element"}`);
  }
  return document;
};

const getEntrySizes = (entry) => ({
  compressed: entry && entry._data && entry._data.compressedSize,
  uncompressed: entry && entry._data && entry._data.uncompressedSize,
});

const validateArchiveLimits = (zip, limits) => {
  const entries = Object.values(zip.files);
  if (entries.length > limits.maxEntryCount) {
    throw new Error(`Workbook ZIP has ${entries.length} entries; limit is ${limits.maxEntryCount}`);
  }
  let totalUncompressed = 0;
  entries.forEach((entry) => {
    if (entry.dir) return;
    const { compressed, uncompressed } = getEntrySizes(entry);
    if (!Number.isSafeInteger(compressed) || !Number.isSafeInteger(uncompressed)) {
      throw new Error(`Workbook ZIP entry ${entry.name} has invalid size metadata`);
    }
    if (uncompressed > limits.maxEntryUncompressedBytes) {
      throw new Error(`Workbook ZIP entry ${entry.name} exceeds the uncompressed-size limit`);
    }
    totalUncompressed += uncompressed;
    if (totalUncompressed > limits.maxTotalUncompressedBytes) {
      throw new Error("Workbook ZIP exceeds the total uncompressed-size limit");
    }
    if (uncompressed > 0 && (compressed === 0 || uncompressed / compressed > limits.maxCompressionRatio)) {
      throw new Error(`Workbook ZIP entry ${entry.name} exceeds the compression-ratio limit`);
    }
  });
};

const readXml = async (zip, entryName, limits, required = true) => {
  const entry = zip.file(entryName);
  if (!entry) {
    if (required) throw new Error(`Missing OOXML entry ${entryName}`);
    return null;
  }
  const { uncompressed } = getEntrySizes(entry);
  if (uncompressed > limits.maxXmlBytes) {
    throw new Error(`OOXML entry ${entryName} exceeds the XML-size limit`);
  }
  return entry.async("string");
};

const elements = (root, localName) => Array.from(root.getElementsByTagNameNS("*", localName));

const normalizeExcelText = (text) => {
  let encodedReplacementCount = 0;
  const encodedReplacements = {};
  const encodedUnresolved = [];
  const protectedEscapes = [];
  let placeholderPrefix = "__CCDC_LITERAL_ESCAPE_";
  while (text.includes(placeholderPrefix)) placeholderPrefix += "X";

  let value = text.replace(/_x005F_(x[0-9A-Fa-f]{4}_)/g, (match) => {
    protectedEscapes.push(match);
    return `${placeholderPrefix}${protectedEscapes.length - 1}__`;
  });

  value = value.replace(/_x([0-9A-Fa-f]{4})_/g, (match, hex) => {
    const codePoint = Number.parseInt(hex, 16);
    const code = `U+${hex.toUpperCase()}`;
    if (SUPPORTED_ESCAPES.has(codePoint)) {
      encodedReplacementCount += 1;
      encodedReplacements[code] = (encodedReplacements[code] || 0) + 1;
      return SUPPORTED_ESCAPES.get(codePoint);
    }
    if (codePoint !== 0x000A && codePoint !== 0x000D && (codePoint < 0x0020 || codePoint > 0x007E)) {
      encodedUnresolved.push({ character: match, codePoint, code });
    }
    return match;
  });

  value = value.replace(
    new RegExp(`${placeholderPrefix}(\\d+)__`, "g"),
    (_match, index) => protectedEscapes[Number(index)],
  );
  const normalized = normalizeText(value);
  const replacements = { ...encodedReplacements };
  Object.entries(normalized.replacements).forEach(([code, count]) => {
    replacements[code] = (replacements[code] || 0) + count;
  });
  const unresolved = [...encodedUnresolved, ...normalized.unresolved]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.code === item.code) === index);

  return {
    value: normalized.value,
    replacementCount: encodedReplacementCount + normalized.replacementCount,
    replacements,
    unresolved,
  };
};

const relationshipTarget = (target) => {
  if (target.startsWith("/")) return target.substring(1);
  return path.posix.normalize(path.posix.join("xl", target));
};

const readSheetMetadata = async (zip, limits) => {
  const workbookEntry = zip.file("xl/workbook.xml");
  const relationshipsEntry = zip.file("xl/_rels/workbook.xml.rels");
  if (!workbookEntry || !relationshipsEntry) return new Map();

  const workbook = parseXml(await readXml(zip, "xl/workbook.xml", limits), "xl/workbook.xml");
  const relationships = parseXml(
    await readXml(zip, "xl/_rels/workbook.xml.rels", limits),
    "xl/_rels/workbook.xml.rels",
  );
  const targets = new Map(elements(relationships, "Relationship").map((relationship) => [
    relationship.getAttribute("Id"),
    relationshipTarget(relationship.getAttribute("Target")),
  ]));

  return new Map(elements(workbook, "sheet").map((sheet) => {
    const relationshipId = sheet.getAttribute("r:id")
      || sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    return [targets.get(relationshipId), { name: sheet.getAttribute("name") }];
  }).filter(([target]) => target));
};

const cellAddress = (row, column) => {
  let columnNumber = column;
  let columnName = "";
  do {
    columnName = String.fromCharCode(65 + (columnNumber % 26)) + columnName;
    columnNumber = Math.floor(columnNumber / 26) - 1;
  } while (columnNumber >= 0);
  return `${columnName}${row + 1}`;
};

const buildValidationTargets = (workbook) => {
  const targets = new Map();
  const addTarget = (sheetIndex, row, column, value) => {
    if (!containsSpecialCharacters(value)) return;
    const sheet = workbook[sheetIndex];
    if (!sheet || typeof sheet.name !== "string") return;
    const addresses = targets.get(sheet.name) || new Set();
    addresses.add(cellAddress(row, column));
    targets.set(sheet.name, addresses);
  };

  const resourceData = workbook[0] && Array.isArray(workbook[0].data) ? workbook[0].data : [];
  [
    [9, 2], [9, 3], [14, 1], [14, 0], [9, 4], [14, 3], [14, 4], [14, 8],
    [14, 7], [14, 5], [14, 6], [14, 2], [9, 0], [17, 0], [17, 4],
  ].forEach(([row, column]) => addTarget(0, row, column, resourceData[row] && resourceData[row][column]));

  const datasetData = workbook[1] && Array.isArray(workbook[1].data) ? workbook[1].data : [];
  for (let row = 1; row < datasetData.length; row += 1) {
    for (let column = 2; column <= 8; column += 1) {
      addTarget(1, row, column, datasetData[row] && datasetData[row][column]);
    }
  }

  for (let datasetIndex = 0; datasetIndex < Math.max(0, datasetData.length - 1); datasetIndex += 1) {
    const datasetRow = datasetData[datasetIndex + 1] || [];
    if (datasetRow.length === 0) continue;
    const digestSheetIndex = datasetIndex + 2;
    const digestData = workbook[digestSheetIndex] && Array.isArray(workbook[digestSheetIndex].data)
      ? workbook[digestSheetIndex].data
      : [];
    for (let row = 1; row < digestData.length; row += 1) {
      for (let column = 1; column <= 7; column += 1) {
        addTarget(digestSheetIndex, row, column, digestData[row] && digestData[row][column]);
      }
    }
  }
  return targets;
};

const recordTextElements = (textElements) => {
  let replacementCount = 0;
  const unresolved = [];
  textElements.forEach((textElement) => {
    let elementChanged = false;
    let preserveWhitespace = false;
    Array.from(textElement.childNodes)
      .filter((node) => node.nodeType === 3 || node.nodeType === 4)
      .forEach((node) => {
        const result = normalizeExcelText(node.data);
        if (result.replacementCount > 0) {
          node.data = result.value;
          elementChanged = true;
          preserveWhitespace = preserveWhitespace || /^[ \t\r\n]|[ \t\r\n]$/.test(result.value);
        }
        replacementCount += result.replacementCount;
        unresolved.push(...result.unresolved);
      });
    if (elementChanged && (preserveWhitespace || /^[ \t\r\n]|[ \t\r\n]$/.test(textElement.textContent))) {
      textElement.setAttributeNS(XML_NAMESPACE, "xml:space", "preserve");
    }
  });
  return { replacementCount, unresolved };
};

const cellTextElements = (container) => {
  const directChildren = Array.from(container.childNodes).filter((node) => node.nodeType === 1);
  const directText = directChildren.filter((node) => node.localName === "t");
  const richText = directChildren
    .filter((node) => node.localName === "r")
    .flatMap((run) => Array.from(run.childNodes)
      .filter((node) => node.nodeType === 1 && node.localName === "t"));
  return [...directText, ...richText];
};

const inspectPackage = async (zip, limits, validationTargets) => {
  const sheetMetadata = await readSheetMetadata(zip, limits);
  const worksheetParts = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/[^/]+\.xml$/i.test(name))
    .sort();
  const sharedStringReferences = new Map();
  const worksheetDocuments = new Map();
  const changedWorksheetParts = new Set();
  const changedCells = [];
  const unresolved = [];
  const modifiedXml = new Map();
  let replacementCount = 0;

  for (const partName of worksheetParts) {
    const metadata = sheetMetadata.get(partName);
    if (!metadata) continue;
    const targetAddresses = validationTargets.get(metadata.name) || new Set();
    const document = parseXml(await readXml(zip, partName, limits), partName);
    worksheetDocuments.set(partName, document);
    const sheet = metadata.name;
    for (const cell of elements(document, "c")) {
      const address = cell.getAttribute("r") || "unknown";
      const isTarget = targetAddresses.has(address) && elements(cell, "f").length === 0;
      const type = cell.getAttribute("t");
      if (type === "s") {
        const valueElement = elements(cell, "v")[0];
        const index = valueElement ? Number.parseInt(valueElement.textContent, 10) : NaN;
        if (Number.isInteger(index)) {
          const references = sharedStringReferences.get(index) || [];
          references.push({
            target: isTarget,
            sheet,
            cell: address,
            valueElement,
            partName,
          });
          sharedStringReferences.set(index, references);
        }
      } else if (type === "inlineStr" && isTarget) {
        const inlineString = elements(cell, "is")[0];
        if (!inlineString) continue;
        const result = recordTextElements(cellTextElements(inlineString));
        if (result.replacementCount > 0) {
          replacementCount += result.replacementCount;
          changedCells.push({ sheet, cell: address, replacementCount: result.replacementCount });
          changedWorksheetParts.add(partName);
        }
        result.unresolved.forEach((item) => unresolved.push({ sheet, cell: address, ...item }));
      }
    }
  }

  const sharedStringsEntry = zip.file("xl/sharedStrings.xml");
  if (sharedStringsEntry) {
    const document = parseXml(
      await readXml(zip, "xl/sharedStrings.xml", limits),
      "xl/sharedStrings.xml",
    );
    let partChanged = false;
    const sharedItems = elements(document, "si");
    let appendedItems = 0;
    sharedItems.forEach((item, index) => {
      const references = sharedStringReferences.get(index) || [];
      const targetReferences = references.filter((reference) => reference.target);
      if (targetReferences.length === 0) return;
      const normalizedItem = item.cloneNode(true);
      const result = recordTextElements(cellTextElements(normalizedItem));
      if (result.replacementCount > 0) {
        replacementCount += result.replacementCount;
        targetReferences.forEach((reference) => changedCells.push({
          sheet: reference.sheet,
          cell: reference.cell,
          replacementCount: result.replacementCount,
        }));
        if (references.some((reference) => !reference.target)) {
          const newIndex = sharedItems.length + appendedItems;
          const extensionList = Array.from(document.documentElement.childNodes)
            .find((node) => node.nodeType === 1 && node.localName === "extLst");
          if (extensionList) {
            document.documentElement.insertBefore(normalizedItem, extensionList);
          } else {
            document.documentElement.appendChild(normalizedItem);
          }
          appendedItems += 1;
          targetReferences.forEach((reference) => {
            reference.valueElement.textContent = String(newIndex);
            changedWorksheetParts.add(reference.partName);
          });
        } else {
          item.parentNode.replaceChild(normalizedItem, item);
        }
        partChanged = true;
      }
      result.unresolved.forEach((unresolvedItem) => {
        targetReferences.forEach((reference) => unresolved.push({
          sheet: reference.sheet,
          cell: reference.cell,
          ...unresolvedItem,
        }));
      });
    });
    if (partChanged) {
      if (appendedItems > 0 && document.documentElement.hasAttribute("uniqueCount")) {
        const uniqueCount = Number.parseInt(document.documentElement.getAttribute("uniqueCount"), 10);
        if (Number.isInteger(uniqueCount)) {
          document.documentElement.setAttribute("uniqueCount", String(uniqueCount + appendedItems));
        }
      }
      modifiedXml.set("xl/sharedStrings.xml", new XMLSerializer().serializeToString(document));
    }
  }

  changedWorksheetParts.forEach((partName) => {
    modifiedXml.set(partName, new XMLSerializer().serializeToString(worksheetDocuments.get(partName)));
  });

  return { replacementCount, changedCells, unresolved, modifiedXml };
};

const verifyPackage = async (buffer, modifiedEntries, workbookParser = xlsx, limits = DEFAULT_LIMITS) => {
  if (buffer.length > limits.maxSourceBytes) {
    throw new Error(`Temporary workbook exceeds the ${limits.maxSourceBytes}-byte limit`);
  }
  const zip = await JSZip.loadAsync(buffer);
  validateArchiveLimits(zip, limits);
  for (const entryName of modifiedEntries) {
    parseXml(await readXml(zip, entryName, limits), entryName);
  }
  const workbook = workbookParser.parse(buffer);
  if (!Array.isArray(workbook) || workbook.length === 0) {
    throw new Error("Temporary workbook contains no readable worksheets");
  }
};

const prepareTemporaryFile = async (source, destination, io, sourceStat) => {
  if (process.platform === "darwin") {
    // macOS cp -p preserves mode, ACLs, flags, and extended attributes such as quarantine.
    // Gatekeeper may rewrite quarantine during cp, so restore every source xattr byte-for-byte.
    const { stdout: sourceAttributeOutput } = await execFileAsync("/usr/bin/xattr", [source]);
    const sourceAttributes = sourceAttributeOutput.split("\n").filter(Boolean);
    await execFileAsync("/bin/cp", ["-p", source, destination]);
    const { stdout: destinationAttributeOutput } = await execFileAsync("/usr/bin/xattr", [destination]);
    const destinationAttributes = destinationAttributeOutput.split("\n").filter(Boolean);
    for (const attribute of destinationAttributes) {
      if (!sourceAttributes.includes(attribute)) {
        await execFileAsync("/usr/bin/xattr", ["-d", attribute, destination]);
      }
    }
    for (const attribute of sourceAttributes) {
      const { stdout: hexValue } = await execFileAsync(
        "/usr/bin/xattr",
        ["-px", attribute, source],
      );
      await execFileAsync(
        "/usr/bin/xattr",
        ["-wx", attribute, hexValue.replace(/\s/g, ""), destination],
      );
    }
    // Writing the verified payload into the copied inode retains restored metadata for rename.
  } else {
    // Node has no portable xattr/ACL API. Preserve mode everywhere and fail no less safely;
    // callers needing non-macOS xattr fidelity should provide prepareTemporaryFile.
    await io.copyFile(source, destination);
    await io.chmod(destination, sourceStat.mode);
  }
};

const sanitizeWorkbook = async (filePath, options = {}) => {
  const io = options.fs || fs.promises;
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const sourceStat = await io.stat(filePath);
  if (sourceStat.size > limits.maxSourceBytes) {
    throw new Error(`Workbook source exceeds the ${limits.maxSourceBytes}-byte limit`);
  }
  const original = await io.readFile(filePath);
  if (original.length > limits.maxSourceBytes) {
    throw new Error(`Workbook source exceeds the ${limits.maxSourceBytes}-byte limit`);
  }
  const zip = await JSZip.loadAsync(original);
  validateArchiveLimits(zip, limits);
  const workbookParser = options.workbookParser || xlsx;
  const parsedWorkbook = workbookParser.parse(original);
  const validationTargets = buildValidationTargets(parsedWorkbook);
  const inspection = await inspectPackage(zip, limits, validationTargets);
  const result = {
    modified: inspection.replacementCount > 0,
    replacementCount: inspection.replacementCount,
    changedCells: inspection.changedCells,
    unresolved: inspection.unresolved,
  };
  if (!result.modified) return result;

  inspection.modifiedXml.forEach((xml, entryName) => zip.file(entryName, xml));
  const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp.xlsx`,
  );
  try {
    await (options.prepareTemporaryFile || prepareTemporaryFile)(
      filePath,
      temporaryPath,
      io,
      sourceStat,
    );
    await io.writeFile(temporaryPath, output);
    const temporary = await io.readFile(temporaryPath);
    await verifyPackage(
      temporary,
      inspection.modifiedXml.keys(),
      workbookParser,
      limits,
    );
    await io.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await io.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") error.cleanupError = cleanupError;
    }
    throw error;
  }
  return result;
};

module.exports = {
  sanitizeWorkbook,
  normalizeExcelText,
  buildValidationTargets,
  DEFAULT_LIMITS,
};
