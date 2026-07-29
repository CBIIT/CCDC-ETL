const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
const util = require("../../common/utils");
let validateHelper = {};

const checkDataResourceInfo = (dataResourceSheet) => {
    let valid = true;
    let data = dataResourceSheet.data;
    const sheetPrefix = "[Data Resource Info] ";
    if (util.containsSpecialCharacters(data[9][2])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource ID.");
    }
    if (util.containsSpecialCharacters(data[9][3])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Name.");
    }
    if (util.containsSpecialCharacters(data[14][1])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Type.");
    }
    if (util.containsSpecialCharacters(data[14][0])) {
        valid = false;
        const value = (data[14][0] || '').toString();
        logger.error(sheetPrefix + "Found special characters in Resource Description. Value: " + value.substring(0, 50));
    }
    if (util.containsSpecialCharacters(data[9][4])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource URI.");
    }
    if (util.containsSpecialCharacters(data[14][3])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource POC.");
    }
    if (util.containsSpecialCharacters(data[14][4])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource POC Email.");
    }
    if (util.containsSpecialCharacters(data[14][8])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource API.");
    }
    if (util.containsSpecialCharacters(data[14][7])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Pediatric Specific.");
    }
    if (util.containsSpecialCharacters(data[14][5])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Analytics.");
    }
    if (util.containsSpecialCharacters(data[14][6])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Visualization.");
    }
    if (util.containsSpecialCharacters(data[14][2])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Content Type.");
    }
    if (util.containsSpecialCharacters(data[9][0])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Initial Submission Date.");
    }
    if (util.containsSpecialCharacters(data[17][0])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Data Update Date.");
    }
    if (util.containsSpecialCharacters(data[17][4])) {
        valid = false;
        logger.error(sheetPrefix + "Found special characters in Resource Contact URL.");
    }
    return valid;
};

const checkDatasetsInfo = (datasetInfoSheet) => {
    let valid = true;
    let data = datasetInfoSheet.data;
    let len = data.length - 1;
    const sheetPrefix = "[Dataset Info] ";
    for(let i = 0; i < len; i++){
        if (util.containsSpecialCharacters(data[i+1][2])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Dataset Name on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][3])) {
            valid = false;
            const value = (data[i+1][3] || '').toString();
            logger.error(sheetPrefix + "Found special characters in Dataset Full Name on Row: " + (i+1) + ", Value: " + value.substring(0, 50));
        }
        if (util.containsSpecialCharacters(data[i+1][4])) {
            valid = false;
            const value = (data[i+1][4] || '').toString();
            logger.error(sheetPrefix + "Found special characters in Dataset Description on Row: " + (i+1) + ", Value: " + value.substring(0, 50));
        }
        if (util.containsSpecialCharacters(data[i+1][5])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Dataset Scope on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][6])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Dataset POC on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][7])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Dataset POC Email on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][8])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Dataset Published In on Row: " + (i+1));
        }
    }
    return valid;
};

const checkDigest = (digestSheet, datasetName) => {
    let valid = true;
    let data = digestSheet.data;
    let len = data.length - 1;
    const sheetPrefix = "[" + (datasetName || "Digest") + "] ";
    for(let i = 0; i< len; i++){
        if (util.containsSpecialCharacters(data[i+1][1])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Parent Digest Level on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][2])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Digest Level on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][3])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Core Element on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][4])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Data Element on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][5])) {
            valid = false;
            const value = (data[i+1][5] || '').toString();
            logger.error(sheetPrefix + "Found special characters in Element Value on Row: " + (i+1) + ", Value: " + value);
        }
        if (util.containsSpecialCharacters(data[i+1][6])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Statistic Type on Row: " + (i+1));
        }
        if (util.containsSpecialCharacters(data[i+1][7])) {
            valid = false;
            logger.error(sheetPrefix + "Found special characters in Statistic Value on Row: " + (i+1));
        }
    }
    return valid;
};

validateHelper.check = (digestFile) => {
    let valid = checkDataResourceInfo(digestFile[0]);
    valid = valid && checkDatasetsInfo(digestFile[1]);
    const data = digestFile[1].data;
    let len = data.length - 1;
    for(let i = 0; i< len; i++){
        if (data[i+1].length === 0) {
            continue;
        }
        const datasetName = data[i+1][2] || "Dataset_" + (i+1);
        const result = checkDigest(digestFile[i + 2], datasetName);
        valid = valid && result;
    }
    return valid;
};

validateHelper.checkSiteChangeLog = (siteChangeLogs) => {
    if (!Array.isArray(siteChangeLogs) || siteChangeLogs.length === 0) {
        logger.error("SITE_ANNOUNCEMENT_URL produced no release records");
        return false;
    }

    const limits = {
        releaseId: 500,
        title: 500,
        version: 100,
        contentType: 500,
        description: 3000,
    };
    let valid = true;

    siteChangeLogs.forEach((record, index) => {
        const row = index + 1;
        ["releaseId", "title", "version", "postDate", "contentType", "description", "details"]
          .forEach((field) => {
            if (typeof record[field] !== "string" || !record[field].trim()) {
                logger.error(`Missing ${field} in SITE_ANNOUNCEMENT_URL release ${row}`);
                valid = false;
            }
          });

        Object.entries(limits).forEach(([field, limit]) => {
            if (typeof record[field] === "string" && record[field].length > limit) {
                logger.error(`${field} exceeds ${limit} characters in SITE_ANNOUNCEMENT_URL release ${row}`);
                valid = false;
            }
        });

        const parsedDate = new Date(`${record.postDate}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.postDate)
            || Number.isNaN(parsedDate.getTime())
            || parsedDate.toISOString().substring(0, 10) !== record.postDate) {
            logger.error(`Invalid postDate in SITE_ANNOUNCEMENT_URL release ${row}`);
            valid = false;
        }
        if (record.logType !== 1 || record.status !== 1) {
            logger.error(`Invalid logType or status in SITE_ANNOUNCEMENT_URL release ${row}`);
            valid = false;
        }
        if (typeof record.details === "string"
            && Buffer.byteLength(record.details, "utf8") > 65535) {
            logger.error(`details exceeds the changelog TEXT limit in SITE_ANNOUNCEMENT_URL release ${row}`);
            valid = false;
        }
    });

    return valid;
};

module.exports = validateHelper;
