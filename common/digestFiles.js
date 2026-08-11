const fs = require("fs");
const path = require("path");

const EXCLUDED_FILES = new Set([
  "site_announcement_log.yaml",
  "site_announcement_log.xlsx",
]);

const listDigestFiles = (folder) => fs.readdirSync(folder, { withFileTypes: true })
  .filter((entry) => !entry.name.startsWith("."))
  .filter((entry) => !EXCLUDED_FILES.has(entry.name))
  .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".xlsx")
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

module.exports = { listDigestFiles };
