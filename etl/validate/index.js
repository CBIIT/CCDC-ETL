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
      const workSheetsFromFile = xlsx.parse(`${digestFileFolder}/${file}`);
      const result = validateHelper.check(workSheetsFromFile);
      if (!result) {
        logger.error("Failed when validating digest file: " + file);
      }
      valid = valid && result;
    }
    
    return valid;
};

module.exports = validate;