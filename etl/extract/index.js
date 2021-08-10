const config = require('../../config');
const logger = require('../../common/logger');
const fs = require('fs');
const xlsx = require('node-xlsx').default;
const extractHelper = require('./extractHelper');

// Parse a file

let extract = {};

extract.run = async () => {
    //get data from spreadsheet and store them into relational DB
    const digest_file_folder = config.digest_file_folder;
    const files = fs.readdirSync(digest_file_folder);
    for(let i = 0; i< files.length; i++){
        let file = files[i];
        const workSheetsFromFile = xlsx.parse(`${digest_file_folder}/${file}`);
        let data_resource = extractHelper.getDataResourceInfo(workSheetsFromFile[0]);
        //update data resource info to RDB if exists, otherwise create a new row
        let resource_id = await extractHelper.insertOrUpdateDataResource(data_resource);
        let data_submission_info = extractHelper.getDataSubmissionInfo(workSheetsFromFile[0]);
        data_submission_info.resource_id = resource_id;
        //insert submission info to RDB 
        let submission_id = await extractHelper.insertSubmission(data_submission_info);
        let datasets_info = extractHelper.getDatasetsInfo(workSheetsFromFile[1]);
        let len = datasets_info.length;
        for(let i = 0; i< len; i++){
            //insert datasets info to RDB
            let dataset_info = datasets_info[i];
            dataset_info.submission_id = submission_id;
            let dataset_id = await extractHelper.insertDataset(dataset_info);
            let digests = extractHelper.getDigest(workSheetsFromFile[i + 2]);
            for(let j = 0; j < digests.length ; j++){
                let digest = digests[j];
                digest.dataset_id = dataset_id;
                //insert digests info to RDB
                await extractHelper.insertDigest(digest);
            }
            logger.info("Created dataset for " + dataset_info.dataset_name + " and " + digests.length + " digests has been inserted.");
        }
    }
};

module.exports = extract;