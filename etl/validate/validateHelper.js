const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
const util = require("../../common/utils");
let validateHelper = {};

const checkDataResourceInfo = (dataResourceSheet) => {
    let valid = true;
    let data = dataResourceSheet.data;
    if (util.containsSpecialCharacters(data[9][2])) {
        valid = false;
        logger.error("Found special characters in Resource ID.");
    }
    if (util.containsSpecialCharacters(data[9][3])) {
        valid = false;
        logger.error("Found special characters in Resource Name.");
    }
    if (util.containsSpecialCharacters(data[14][1])) {
        valid = false;
        logger.error("Found special characters in Resource Type.");
    }
    if (util.containsSpecialCharacters(data[14][0])) {
        valid = false;
        logger.error("Found special characters in Resource Description.");
    }
    if (util.containsSpecialCharacters(data[9][4])) {
        valid = false;
        logger.error("Found special characters in Resource URI.");
    }
    if (util.containsSpecialCharacters(data[14][3])) {
        valid = false;
        logger.error("Found special characters in Resource POC.");
    }
    if (util.containsSpecialCharacters(data[14][4])) {
        valid = false;
        logger.error("Found special characters in Resource POC Email.");
    }
    if (util.containsSpecialCharacters(data[14][8])) {
        valid = false;
        logger.error("Found special characters in Resource API.");
    }
    if (util.containsSpecialCharacters(data[14][7])) {
        valid = false;
        logger.error("Found special characters in Resource Pediatric Specific.");
    }
    if (util.containsSpecialCharacters(data[14][5])) {
        valid = false;
        logger.error("Found special characters in Resource Analytics.");
    }
    if (util.containsSpecialCharacters(data[14][6])) {
        valid = false;
        logger.error("Found special characters in Resource Visualization.");
    }
    if (util.containsSpecialCharacters(data[14][2])) {
        valid = false;
        logger.error("Found special characters in Resource Content Type.");
    }
    if (util.containsSpecialCharacters(data[9][0])) {
        valid = false;
        logger.error("Found special characters in Resource Initial Submission Date.");
    }
    if (util.containsSpecialCharacters(data[17][0])) {
        valid = false;
        logger.error("Found special characters in Resource Data Update Date.");
    }
    return valid;
};

const checkDatasetsInfo = (datasetInfoSheet) => {
    let valid = true;
    let data = datasetInfoSheet.data;
    let len = data.length - 1;
    for(let i = 0; i < len; i++){
        if (util.containsSpecialCharacters(data[i+1][2])) {
            valid = false;
            logger.error("Found special characters in Dataset Name on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][3])) {
            valid = false;
            logger.error("Found special characters in Dataset Full Name on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][4])) {
            valid = false;
            logger.error("Found special characters in Dataset Description on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][5])) {
            valid = false;
            logger.error("Found special characters in Dataset Scope on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][6])) {
            valid = false;
            logger.error("Found special characters in Dataset POC on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][7])) {
            valid = false;
            logger.error("Found special characters in Dataset POC Email on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][8])) {
            valid = false;
            logger.error("Found special characters in Dataset Published In on Row: " + (i+1));
        }
    }
    return valid;
};

const checkDigest = (digestSheet) => {
    let valid = true;
    let data = digestSheet.data;
    let len = data.length - 1;
    for(let i = 0; i< len; i++){
        if (util.containsSpecialCharacters(data[i+1][1])) {
            valid = false;
            logger.error("Found special characters in Parent Digest Level on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][2])) {
            valid = false;
            logger.error("Found special characters in Digest Level on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][3])) {
            valid = false;
            logger.error("Found special characters in Core Element on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][4])) {
            valid = false;
            logger.error("Found special characters in Data Element on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][5])) {
            valid = false;
            logger.error("Found special characters in Element Value on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][6])) {
            valid = false;
            logger.error("Found special characters in Statistic Type on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][7])) {
            valid = false;
            logger.error("Found special characters in Statistic Value on Row: " + (i+1));
        }
    }
    return valid;
};

validateHelper.check = (digestFile) => {
    let valid = checkDataResourceInfo(digestFile[0]);
    valid = valid && checkDatasetsInfo(digestFile[1]);
    const len = digestFile[1].data;
    for(let i = 0; i< len; i++){
        valid = valid && checkDigest(digestFile[i + 2]);
    }
    return valid;
};

module.exports = validateHelper;