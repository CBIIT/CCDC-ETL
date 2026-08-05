const config = require("../../config");
const logger = require("../../common/logger");
const fs = require("fs");
const xlsx = require("node-xlsx").default;
const validateHelper = require("./validateHelper");

let validate = {};

validate.run = async (siteAnnouncements) => {
    //get data from spreadsheet
    const digestFileFolder = config.digestFileFolder;
    const files = fs.readdirSync(digestFileFolder);
    //validating digest files
    let valid = true;
    for(let i = 0; i< files.length; i++){
      let file = files[parseInt(i, 10)];
      if (file.startsWith(".")) {
        continue;
      }
      if (file === "site_announcement_log.yaml" || file === "site_announcement_log.xlsx") {
        continue;
      }
      const workSheetsFromFile = xlsx.parse(`${digestFileFolder}/${file}`);
      const result = validateHelper.check(workSheetsFromFile);
      if (!result) {
        logger.error("Failed when validating digest file: " + file);
      }
      valid = valid && result;
    }

    try {
      const announcementValid = validateHelper.checkSiteChangeLog(siteAnnouncements);
      if (!announcementValid) {
        logger.error("Failed when validating site announcements from SITE_ANNOUNCEMENT_URL");
      }
      valid = valid && announcementValid;
    } catch (error) {
      logger.error(`Failed when validating SITE_ANNOUNCEMENT_URL: ${error.message}`);
      valid = false;
    }

    return valid;
};

module.exports = validate;
