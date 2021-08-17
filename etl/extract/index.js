const config = require("../../config");
const logger = require("../../common/logger");
const fs = require("fs");
const xlsx = require("node-xlsx").default;
const extractHelper = require("./extractHelper");

// Parse a file

let extract = {};

extract.run = async () => {
    //get data from spreadsheet and store them into relational DB
    const digestFileFolder = config.digestFileFolder;
    const files = fs.readdirSync(digestFileFolder);
    for(let i = 0; i< files.length; i++){
        let file = files[parseInt(i, 10)];
        const workSheetsFromFile = xlsx.parse(`${digestFileFolder}/${file}`);
        let dataResource = extractHelper.getDataResourceInfo(workSheetsFromFile[0]);
        //update data resource info to RDB if exists, otherwise create a new row
        let resourceId = await extractHelper.insertOrUpdateDataResource(dataResource);
        let dataSubmissionInfo = extractHelper.getDataSubmissionInfo(workSheetsFromFile[0]);
        dataSubmissionInfo.resourceId = resourceId;
        //insert submission info to RDB 
        let submissionId = await extractHelper.insertSubmission(dataSubmissionInfo);
        let datasetsInfo = extractHelper.getDatasetsInfo(workSheetsFromFile[1]);
        let len = datasetsInfo.length;
        for(let i = 0; i< len; i++){
            //insert datasets info to RDB
            let datasetInfo = datasetsInfo[parseInt(i, 10)];
            datasetInfo.submissionId = submissionId;
            let datasetId = await extractHelper.insertDataset(datasetInfo);
            let digests = extractHelper.getDigest(workSheetsFromFile[i + 2]);
            for(let j = 0; j < digests.length ; j++){
                let digest = digests[parseInt(j, 10)];
                digest.datasetId = datasetId;
                //insert digests info to RDB
                await extractHelper.insertDigest(digest);
            }
            logger.info("Created dataset for " + datasetInfo.datasetName + " and " + digests.length + " digests has been inserted.");
        }
    }
};

module.exports = extract;