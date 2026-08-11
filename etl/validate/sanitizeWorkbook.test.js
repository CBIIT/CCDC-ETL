import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { execFileSync } from "child_process";
import JSZip from "jszip";
import xlsx from "node-xlsx";
import { afterEach, describe, expect, it } from "vitest";
import sanitizer from "./sanitizeWorkbook";

const worksheetXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:I18"/><sheetData>
 <row r="1"><c r="A1" t="inlineStr"><is><t>ignored–café</t></is></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="str"><f>"formula–text"</f><v>123–cached</v></c></row>
 <row r="10"><c r="C10" t="s"><v>0</v></c><c r="D10" t="s"><v>1</v></c><c r="E10" t="s"><v>1</v></c></row>
 <row r="15"><c r="A15" t="inlineStr"><is><r><t>\tleft–</t></r><r><t>right </t></r></is></c></row>
 <row r="18"><c r="E18" t="s"><v>2</v></c></row>
</sheetData><mergeCells count="1"><mergeCell ref="H1:I1"/></mergeCells></worksheet>`;
const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="5" uniqueCount="4">
 <si><t> A&amp;B C</t><rPh sb="0" eb="1"><t>phonetic–café</t></rPh></si>
 <si><r><t>Don</t></r><r><t>’t_x0009_</t></r></si>
 <si><t>café and _x005F_x0009_</t></si>
 <si><t>orphan–café</t></si>
 <extLst><ext uri="{CCDC-TEST}"><x:marker xmlns:x="urn:ccdc:test">keep-me</x:marker></ext></extLst>
</sst>`;

const makeWorkbook = async ({ clean = false, orphanOnly = false, trailingOnly = false } = {}) => {
  const base = xlsx.build([
    { name: "Resource", data: [["placeholder"]] },
    { name: "Dataset", data: [["header"]] },
    { name: "Digest", data: [["header"]] },
    { name: "Glossary", data: [[trailingOnly ? "clean" : "ignored–café"]] },
  ]);
  const zip = await JSZip.loadAsync(base);
  const relationships = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  zip.file("xl/_rels/workbook.xml.rels", relationships.replace(
    "</Relationships>",
    '<Relationship Id="rId999" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>',
  ));
  const contentTypes = await zip.file("[Content_Types].xml").async("string");
  zip.file("[Content_Types].xml", contentTypes.replace(
    "</Types>",
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
  ));
  let worksheet = clean
    ? worksheetXml.replace("\tleft–", " left-").replace("right ", "right ")
    : worksheetXml;
  let sharedStrings = clean
    ? sharedStringsXml.replace(/ /g, " ").replace("’", "'").replace("_x0009_", " ")
    : sharedStringsXml;
  if (orphanOnly) sharedStrings = sharedStrings.replace("café and", "cafe and");
  if (trailingOnly) {
    worksheet = worksheet.replace("ignored–café", "ignored-cafe")
      .replace("formula–text", "formula-text")
      .replace("123–cached", "123-cached");
    sharedStrings = sharedStrings
      .replace("café and", "cafe and")
      .replace("orphan–café", "orphan-cafe")
      .replace("phonetic–café", "phonetic-cafe")
      .replace("<si><t> A&amp;B C</t>", "<si><t>ASCII </t>");
  }
  zip.file("xl/worksheets/sheet1.xml", worksheet);
  zip.file("xl/sharedStrings.xml", sharedStrings);
  zip.file("xl/styles.xml", "<styleSheet><custom>unchanged</custom></styleSheet>");
  zip.file("customXml/item1.xml", "<custom value=\"untouched\"/>");
  return zip.generateAsync({ type: "nodebuffer" });
};

const makeNumericSheetOrderWorkbook = async () => {
  const base = xlsx.build([
    { name: "Resource", data: [["raw first"]] },
    { name: "1", data: [["numeric name"]] },
    { name: "Digest", data: [["digest"]] },
  ]);
  const zip = await JSZip.loadAsync(base);
  const relationships = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  zip.file("xl/_rels/workbook.xml.rels", relationships.replace(
    "</Relationships>",
    '<Relationship Id="rId999" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>',
  ));
  const contentTypes = await zip.file("[Content_Types].xml").async("string");
  zip.file("[Content_Types].xml", contentTypes.replace(
    "</Types>",
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
  ));
  const sheet = (sharedIndex) => `<?xml version="1.0" encoding="UTF-8"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <dimension ref="A1:A10"/><sheetData><row r="10"><c r="A10" t="s"><v>${sharedIndex}</v></c></row></sheetData>
    </worksheet>`;
  zip.file("xl/worksheets/sheet1.xml", sheet(0));
  zip.file("xl/worksheets/sheet2.xml", sheet(1));
  zip.file("xl/sharedStrings.xml", `<?xml version="1.0" encoding="UTF-8"?>
    <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="2" uniqueCount="2">
      <si><t>wrong–raw-index</t></si><si><t>right–parsed-order</t></si>
    </sst>`);
  return zip.generateAsync({ type: "nodebuffer" });
};

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

describe("sanitizeWorkbook", () => {
  const folders = [];
  afterEach(() => folders.splice(0).forEach((folder) => fs.rmSync(folder, { recursive: true })));

  const fixturePath = async (options) => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ccdc-workbook-"));
    folders.push(folder);
    const file = path.join(folder, "fixture.xlsx");
    fs.writeFileSync(file, await makeWorkbook(options));
    return file;
  };

  it("edits only shared and inline string text and reports locations", async () => {
    const file = await fixturePath();
    const beforeZip = await JSZip.loadAsync(fs.readFileSync(file));
    const untouchedBefore = await beforeZip.file("customXml/item1.xml").async("nodebuffer");

    const result = await sanitizer.sanitizeWorkbook(file);

    expect(result).toMatchObject({ modified: true, replacementCount: 7 });
    expect(result.changedCells).toEqual(expect.arrayContaining([
      expect.objectContaining({ sheet: "Resource", cell: "C10" }),
      expect.objectContaining({ sheet: "Resource", cell: "D10" }),
      expect.objectContaining({ sheet: "Resource", cell: "E10" }),
      expect.objectContaining({ sheet: "Resource", cell: "A15" }),
    ]));
    expect(result.unresolved).toEqual([
      expect.objectContaining({ sheet: "Resource", cell: "E18", code: "U+00E9" }),
    ]);

    const afterZip = await JSZip.loadAsync(fs.readFileSync(file), { checkCRC32: true });
    const shared = await afterZip.file("xl/sharedStrings.xml").async("string");
    const worksheet = await afterZip.file("xl/worksheets/sheet1.xml").async("string");
    expect(shared).toContain('<t xml:space="preserve"> A&amp;B C</t>');
    expect(shared.replace(/<[^>]+>/g, "")).toContain("Don't ");
    expect(shared).toContain("café and _x005F_x0009_");
    expect(shared).toContain("orphan–café");
    expect(shared).toContain("phonetic–café");
    expect(shared).toContain("’t_x0009_");
    expect(shared).toContain('uniqueCount="5"');
    expect(shared).toContain('<x:marker xmlns:x="urn:ccdc:test">keep-me</x:marker>');
    expect(shared.lastIndexOf("</si>")).toBeLessThan(shared.indexOf("<extLst>"));
    expect(shared.trim().endsWith("</extLst>\n</sst>")).toBe(true);
    expect(worksheet).toContain('<t xml:space="preserve"> left-</t>');
    expect(worksheet).toContain('<t xml:space="preserve">right </t>');
    expect(worksheet).toContain("formula–text");
    expect(worksheet).toContain("123–cached");
    expect(worksheet).toContain("ignored–café");
    const parsed = xlsx.parse(fs.readFileSync(file));
    expect(parsed[0].name).toBe("Resource");
    expect(parsed[0].data[9][3]).toBe("Don't ");
    expect(parsed[0].data[0][1]).toBe("Don’t\t");
    expect(sha256(await afterZip.file("customXml/item1.xml").async("nodebuffer")))
      .toBe(sha256(untouchedBefore));

    await expect(sanitizer.sanitizeWorkbook(file)).resolves.toMatchObject({
      modified: false,
      replacementCount: 0,
    });
  });

  it("does not rewrite a workbook when no supported replacement exists", async () => {
    const file = await fixturePath({ clean: true });
    const before = fs.readFileSync(file);
    const mtime = fs.statSync(file).mtimeMs;

    const result = await sanitizer.sanitizeWorkbook(file);

    expect(result.modified).toBe(false);
    expect(fs.readFileSync(file)).toEqual(before);
    expect(fs.statSync(file).mtimeMs).toBe(mtime);
  });

  it("ignores mapped and unresolved characters in orphan shared strings", async () => {
    const file = await fixturePath({ clean: true, orphanOnly: true });
    const before = fs.readFileSync(file);

    const result = await sanitizer.sanitizeWorkbook(file);

    expect(result).toMatchObject({ modified: false, replacementCount: 0, unresolved: [] });
    expect(fs.readFileSync(file)).toEqual(before);
    const zip = await JSZip.loadAsync(before);
    expect(await zip.file("xl/sharedStrings.xml").async("string")).toContain("orphan–café");
  });

  it("does not rewrite a workbook whose only special character is a validator-ignored trailing NBSP", async () => {
    const file = await fixturePath({ clean: true, trailingOnly: true });
    const before = fs.readFileSync(file);
    const mtime = fs.statSync(file).mtimeMs;

    const result = await sanitizer.sanitizeWorkbook(file);

    expect(result).toMatchObject({ modified: false, replacementCount: 0, unresolved: [] });
    expect(fs.readFileSync(file)).toEqual(before);
    expect(fs.statSync(file).mtimeMs).toBe(mtime);
  });

  it("associates validator targets by parsed sheet name when numeric names reorder parsed sheets", async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ccdc-numeric-sheet-"));
    folders.push(folder);
    const file = path.join(folder, "numeric-sheet.xlsx");
    fs.writeFileSync(file, await makeNumericSheetOrderWorkbook());
    expect(xlsx.parse(fs.readFileSync(file)).map((sheet) => sheet.name))
      .toEqual(["1", "Resource", "Digest"]);

    const result = await sanitizer.sanitizeWorkbook(file);

    expect(result).toMatchObject({ modified: true, replacementCount: 1 });
    expect(result.changedCells).toEqual([
      expect.objectContaining({ sheet: "1", cell: "A10" }),
    ]);
    const parsed = xlsx.parse(fs.readFileSync(file));
    expect(parsed[0].data[9][0]).toBe("right-parsed-order");
    expect(parsed[1].data[9][0]).toBe("wrong–raw-index");
  });

  it("preserves source mode across atomic replacement", async () => {
    const file = await fixturePath();
    fs.chmodSync(file, 0o640);

    await sanitizer.sanitizeWorkbook(file);

    expect(fs.statSync(file).mode & 0o777).toBe(0o640);
  });

  it.runIf(process.platform === "darwin")(
    "preserves the macOS quarantine extended attribute across atomic replacement",
    async () => {
      const file = await fixturePath();
      const quarantine = "0081;CCDC sanitizer test;Codex;fixture";
      execFileSync("/usr/bin/xattr", ["-w", "com.apple.quarantine", quarantine, file]);
      const storedQuarantine = execFileSync(
        "/usr/bin/xattr",
        ["-p", "com.apple.quarantine", file],
        { encoding: "utf8" },
      );

      await sanitizer.sanitizeWorkbook(file);

      expect(execFileSync(
        "/usr/bin/xattr",
        ["-p", "com.apple.quarantine", file],
        { encoding: "utf8" },
      )).toBe(storedQuarantine);
    },
  );

  it("rejects oversized source files and excessive ZIP entry counts before XML inflation", async () => {
    const file = await fixturePath();
    await expect(sanitizer.sanitizeWorkbook(file, {
      limits: { maxSourceBytes: 1 },
    })).rejects.toThrow("source exceeds");
    await expect(sanitizer.sanitizeWorkbook(file, {
      limits: { maxEntryCount: 1 },
    })).rejects.toThrow("entries");
  });

  it("rejects XML parts above the configured DOM parsing limit", async () => {
    const file = await fixturePath();
    await expect(sanitizer.sanitizeWorkbook(file, {
      limits: { maxXmlBytes: 10 },
    })).rejects.toThrow("XML-size limit");
  });

  it("keeps the original and removes its temporary file when rename fails", async () => {
    const file = await fixturePath();
    const before = fs.readFileSync(file);
    const failingIo = new Proxy(fs.promises, {
      get(target, property) {
        if (property === "rename") return async () => { throw new Error("simulated rename failure"); };
        const value = target[property];
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

    await expect(sanitizer.sanitizeWorkbook(file, { fs: failingIo }))
      .rejects.toThrow("simulated rename failure");

    expect(fs.readFileSync(file)).toEqual(before);
    expect(fs.readdirSync(path.dirname(file))).toEqual(["fixture.xlsx"]);
  });

  it("keeps the original and removes its temporary file when semantic verification fails", async () => {
    const file = await fixturePath();
    const before = fs.readFileSync(file);
    let parseCount = 0;
    const workbookParser = {
      parse(buffer) {
        parseCount += 1;
        if (parseCount === 1) return xlsx.parse(buffer);
        throw new Error("simulated workbook parse failure");
      },
    };

    await expect(sanitizer.sanitizeWorkbook(file, { workbookParser }))
      .rejects.toThrow("simulated workbook parse failure");

    expect(fs.readFileSync(file)).toEqual(before);
    expect(fs.readdirSync(path.dirname(file))).toEqual(["fixture.xlsx"]);
  });
});

describe("normalizeExcelText", () => {
  it("handles Excel escape tokens but protects escaped literal tokens", () => {
    expect(sanitizer.normalizeExcelText("a_x2013_b_x0009_c")).toMatchObject({
      value: "a-b c",
      replacementCount: 2,
    });
    expect(sanitizer.normalizeExcelText("_x005F_x0009_")).toMatchObject({
      value: "_x005F_x0009_",
      replacementCount: 0,
    });
    expect(sanitizer.normalizeExcelText("__CCDC_LITERAL_ESCAPE_0__")).toMatchObject({
      value: "__CCDC_LITERAL_ESCAPE_0__",
      replacementCount: 0,
    });
  });
});
