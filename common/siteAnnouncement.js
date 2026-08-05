const axios = require("axios");
const dns = require("dns");
const https = require("https");
const net = require("net");
const { marked } = require("marked");
const { stripHtml } = require("string-strip-html");

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const blockedAddresses = new net.BlockList();
const monthNumbers = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
].forEach(([address, prefix]) => blockedAddresses.addSubnet(address, prefix, "ipv4"));

[
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
].forEach(([address, prefix]) => blockedAddresses.addSubnet(address, prefix, "ipv6"));

const configureMarkedRenderer = () => {
  const renderer = new marked.Renderer();
  const defaultLink = renderer.link.bind(renderer);
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  renderer.link = (href, title, text) => {
    const normalizedHref = String(href || "")
      .trim()
      .replace(/[\u0000-\u0020]+/g, "")
      .toLowerCase();
    const isExternal = /^(https?:\/\/|mailto:)/.test(normalizedHref);
    const isLocal = /^\/(?!\/)/.test(normalizedHref) || normalizedHref.startsWith("#");
    if (!isExternal && !isLocal) {
      return text;
    }
    const link = defaultLink(href, title, text);
    if (isExternal) {
      return link.replace("<a ", '<a target="_blank" rel="noreferrer" ');
    }
    return link;
  };
  renderer.image = (href, title, text) => escapeHtml(text || "");
  renderer.html = (html) => escapeHtml(html);

  marked.setOptions({ renderer, gfm: true, breaks: false });
};

configureMarkedRenderer();

const normalizeDate = (dateText, sectionNumber) => {
  const match = dateText.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match || monthNumbers[match[1].toLowerCase()] === undefined) {
    throw new Error(`Release section ${sectionNumber} has an invalid date`);
  }
  const month = monthNumbers[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsedDate = new Date(Date.UTC(year, month, day));
  if (
    parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month
    || parsedDate.getUTCDate() !== day
  ) {
    throw new Error(`Release section ${sectionNumber} has an invalid date`);
  }
  return parsedDate.toISOString().substring(0, 10);
};

const getMetadata = (section, sectionNumber) => {
  const metadata = {};
  const lines = section.split("\n");
  const delimiterPattern = /^\|\s*:?-{3,}:?\s*\|\s*:?-{3,}:?\s*\|\s*$/;
  const rowPattern = /^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/;

  if (!delimiterPattern.test(lines[1] || "")) {
    throw new Error(`Release section ${sectionNumber} has an invalid metadata table delimiter`);
  }

  for (let index = 2; index < lines.length; index++) {
    const row = lines[index].match(rowPattern);
    if (!row) {
      break;
    }
    const key = stripHtml(row[1]).result.trim();
    const value = stripHtml(row[2]).result.trim();
    if (key) {
      metadata[key] = value;
    }
  }

  ["id", "version", "slug", "contentType"].forEach((key) => {
    if (!metadata[key]) {
      throw new Error(`Release section ${sectionNumber} is missing metadata: ${key}`);
    }
  });
  return metadata;
};

const parseReleaseSection = (section, sectionNumber) => {
  const titleMatch = section.match(/^#\s+(.+?)\s*$/m);
  const dateMatch = section.match(/^###\s+(.+?)\s+\|\s+Release Notes\s*$/m);
  const metadataHeader = section.match(/^\|\s*Property\s*\|\s*Value\s*\|\s*$/m);
  if (!titleMatch) {
    throw new Error(`Release section ${sectionNumber} is missing a title`);
  }
  if (!dateMatch) {
    throw new Error(`Release section ${sectionNumber} is missing a release-date heading`);
  }
  if (!metadataHeader) {
    throw new Error(`Release section ${sectionNumber} is missing its metadata table`);
  }

  const dateHeadingEnd = dateMatch.index + dateMatch[0].length;
  const metadataStart = metadataHeader.index;
  const bodyMarkdown = section.slice(dateHeadingEnd, metadataStart).trim();
  if (!bodyMarkdown) {
    throw new Error(`Release section ${sectionNumber} has an empty release body`);
  }

  const metadata = getMetadata(section.slice(metadataStart), sectionNumber);
  return {
    releaseId: metadata.id,
    logType: 1,
    title: stripHtml(titleMatch[1]).result.trim(),
    version: metadata.version.replace(/^v/i, ""),
    postDate: normalizeDate(dateMatch[1].trim(), sectionNumber),
    contentType: metadata.contentType,
    description: metadata.slug,
    details: marked.parse(bodyMarkdown),
    status: 1,
  };
};

const parseSiteAnnouncementMarkdown = (markdownText) => {
  if (typeof markdownText !== "string" || !markdownText.trim()) {
    throw new Error("Site announcement response is empty");
  }

  const normalizedText = markdownText.replace(/\r\n?/g, "\n");
  const headingPattern = /^#\s+.+$/gm;
  const headings = [...normalizedText.matchAll(headingPattern)];
  if (headings.length === 0) {
    throw new Error("Site announcement response contains no release sections");
  }
  const preamble = normalizedText.slice(0, headings[0].index).trim();
  if (preamble) {
    throw new Error("Release section 1 is missing a title");
  }

  const releases = headings.map((heading, index) => {
    const end = index + 1 < headings.length
      ? headings[index + 1].index
      : normalizedText.length;
    return parseReleaseSection(
      normalizedText.slice(heading.index, end),
      index + 1
    );
  });

  releases.sort((left, right) => (
    new Date(right.postDate).getTime() - new Date(left.postDate).getTime()
  ));
  return releases;
};

const resolvePublicAddress = async (hostname, resolver) => {
  const addresses = await resolver(hostname, { all: true, verbatim: true });
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("SITE_ANNOUNCEMENT_URL hostname did not resolve");
  }

  for (const entry of addresses) {
    const family = entry.family === 6 ? "ipv6" : "ipv4";
    const mappedIpv4 = entry.address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    const blockedMappedIpv4 = mappedIpv4
      ? blockedAddresses.check(mappedIpv4[1], "ipv4")
      : false;
    if (
      !net.isIP(entry.address) ||
      blockedMappedIpv4 ||
      blockedAddresses.check(entry.address, family)
    ) {
      throw new Error("SITE_ANNOUNCEMENT_URL must resolve only to public addresses");
    }
  }

  return addresses[0];
};

const readSiteAnnouncements = async (
  url,
  httpClient = axios,
  resolver = dns.promises.lookup
) => {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("SITE_ANNOUNCEMENT_URL is required");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error("SITE_ANNOUNCEMENT_URL must be a valid HTTPS URL");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("SITE_ANNOUNCEMENT_URL must use HTTPS");
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("SITE_ANNOUNCEMENT_URL must not contain credentials");
  }

  const resolved = await resolvePublicAddress(parsedUrl.hostname, resolver);
  const httpsAgent = new https.Agent({
    keepAlive: false,
    lookup: (hostname, options, callback) => {
      if (options && options.all) {
        callback(null, [resolved]);
      } else {
        callback(null, resolved.address, resolved.family);
      }
    },
  });
  const response = await httpClient.get(parsedUrl.toString(), {
    timeout: 60000,
    clarifyTimeoutError: false,
    responseType: "text",
    maxRedirects: 0,
    maxContentLength: MAX_RESPONSE_BYTES,
    maxBodyLength: MAX_RESPONSE_BYTES,
    httpsAgent,
    proxy: false,
  });

  return parseSiteAnnouncementMarkdown(response.data);
};

module.exports = {
  parseSiteAnnouncementMarkdown,
  readSiteAnnouncements,
};
