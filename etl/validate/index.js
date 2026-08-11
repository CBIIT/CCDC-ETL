const config = require("../../config");
const logger = require("../../common/logger");
const xlsx = require("node-xlsx").default;
const validateHelper = require("./validateHelper");
const { listDigestFiles } = require("../../common/digestFiles");
const { sanitizeWorkbook } = require("./sanitizeWorkbook");

let validate = {};

validate.createRun = ({
  appConfig = config,
  appLogger = logger,
  workbookParser = xlsx,
  validator = validateHelper,
  digestFileLister = listDigestFiles,
  workbookSanitizer = sanitizeWorkbook,
} = {}) => async (siteAnnouncements) => {
    //get data from spreadsheet
    const digestFileFolder = appConfig.digestFileFolder;
    const files = digestFileLister(digestFileFolder);
    const modifiedFiles = new Set();
    //validating digest files
    let valid = true;
    for(let i = 0; i< files.length; i++){
      let file = files[parseInt(i, 10)];
      const workbookPath = `${digestFileFolder}/${file}`;
      try {
        const sanitization = await workbookSanitizer(workbookPath);
        if (sanitization.modified) {
          modifiedFiles.add(file);
          appLogger.info(`Modified digest file ${file}: ${sanitization.replacementCount} replacements.`);
        }
        sanitization.unresolved.forEach((item) => {
          appLogger.error(
            `Unresolved special character ${item.code} (${JSON.stringify(item.character)}) in ${file}, sheet ${item.sheet}, cell ${item.cell}.`,
          );
        });

        const workSheetsFromFile = workbookParser.parse(workbookPath);
        const result = validator.check(workSheetsFromFile);
        if (!result) {
          appLogger.error("Failed when validating digest file: " + file);
        }
        valid = valid && result && sanitization.unresolved.length === 0;
      } catch (error) {
        appLogger.error(`Failed when sanitizing or validating digest file ${file}: ${error.message}`);
        valid = false;
      }
    }

    const sortedModifiedFiles = Array.from(modifiedFiles).sort((left, right) => left.localeCompare(right));
    appLogger.info(sortedModifiedFiles.length === 0
      ? "Modified 0 digest files."
      : `Modified ${sortedModifiedFiles.length} digest files: ${sortedModifiedFiles.join(", ")}`);

    try {
      const announcementValid = validator.checkSiteChangeLog(siteAnnouncements);
      if (!announcementValid) {
        appLogger.error("Failed when validating site announcements from SITE_ANNOUNCEMENT_URL");
      }
      valid = valid && announcementValid;
    } catch (error) {
      appLogger.error(`Failed when validating SITE_ANNOUNCEMENT_URL: ${error.message}`);
      valid = false;
    }

    return valid;
};

validate.run = validate.createRun();

module.exports = validate;
