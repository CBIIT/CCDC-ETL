const config = require("../../config");
const logger = require("../../common/logger");
const fs = require("fs");
const xlsx = require("node-xlsx").default;
const validateHelper = require("./validateHelper");

let validate = {};

validate.run = async () => {
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
      if (file === "site_announcement_log.xlsx") {
        continue;
      }
      const workSheetsFromFile = xlsx.parse(`${digestFileFolder}/${file}`);
      const result = validateHelper.check(workSheetsFromFile);
      if (!result) {
        logger.error("Failed when validating digest file: " + file);
      }
      valid = valid && result;
    }

    //validate site change log file
    try{
      const siteChangeLogFile = xlsx.parse(`${digestFileFolder}/site_announcement_log.xlsx`);
      const validateResult = validateHelper.checkSiteChangeLog(siteChangeLogFile[0].data);
      if (!validateResult) {
        logger.error("Failed when validating site change log file: site_announcement_log.xlsx");
      }
      valid = valid && validateResult;
    }
    catch(error) {
      logger.error(error);
    }

    return valid;
};

module.exports = validate;