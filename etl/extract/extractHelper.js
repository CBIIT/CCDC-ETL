const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
const utils = require("../../common/utils");
let extractHelper = {};

extractHelper.getDataResourceInfo = (dataResourceSheet) => {
    let result = {};
    let data = dataResourceSheet.data;
    result.id = data[9][2];
    result.resourceName = data[9][3];
    result.resourceType = data[14][1];
    result.description = data[14][0] === undefined ? "" : data[14][0].trim();
    result.resourceUri = data[9][4];
    result.siteOwner = "";
    result.poc = data[14][3];
    result.pocEmail = data[14][4];
    result.api = data[14][8] === "No" ? "" : data[14][9];
    result.pediatricSpecific = data[14][7] === "Mix" ? 0 : 1;
    result.analytics = data[14][5] === "Yes" ? 1 : 0;
    result.visualization = data[14][6] === "Yes" ? 1 : 0;
    result.dataContentType = data[14][2];
    // result.hasGenomicsOmics = data[14][2].toLowerCase().indexOf("genomics") > -1? 1 : 0;
    // result.hasImagingData = data[14][2].toLowerCase().indexOf("imaging") > -1? 1 : 0;
    // result.hasClinicalData = data[14][2].toLowerCase().indexOf("clinical") > -1? 1 : 0;
    // result.hasXenograftData = data[14][2].toLowerCase().indexOf("xenograft") > -1? 1 : 0;
    // result.hasCellLinesData = data[14][2].toLowerCase().indexOf("cell") > -1? 1 : 0;
    result.initialSubmissionDate = utils.ExcelDateToJSDate(data[9][0]);
    result.dataUpdateDate = utils.ExcelDateToJSDate(data[17][0]);
    result.suggestedNextDataUpdate = utils.ExcelDateToJSDate(data[17][2]);
    result.status = 1;
    return result;
};

extractHelper.getDataSubmissionInfo = (dataResourceSheet) => {
    let result = {};
    let data = dataResourceSheet.data;
    let tmp = new Date(1900,0).setDate(data[9][0]);
    result.submissionDate = new Date(tmp).toISOString().substring(0, 10);
    result.submissionPoc = data[9][1];
    result.submissionType = 1;
    result.status = 1;
    return result;
};

extractHelper.getDatasetsInfo = (datasetInfoSheet) => {
    let result = [];
    let data = datasetInfoSheet.data;
    let len = data.length - 1;
    for(let i = 0; i < len; i++){
        let tmp = {};
        tmp.datasetName = data[i+1][2];
        if(tmp.datasetName == null){
            break;
        }
        tmp.datasetFullName = data[i+1][3];
        tmp.description = data[i+1][4] === undefined ? "" : data[i+1][4].trim();
        tmp.datasetScope = data[i+1][5];
        tmp.poc = data[i+1][6];
        tmp.pocEmail = data[i+1][7];
        tmp.publishedIn = data[i+1][8];
        tmp.status = 1;
        result.push(tmp);
    }
    return result;
};

extractHelper.getDigest = (digestSheet) => {
    let result = [];
    let data = digestSheet.data;
    let len = data.length - 1;
    for(let i = 0; i< len; i++){
        let tmp = {};
        tmp.parentDigestLevel = data[i + 1][1];
        tmp.digestLevel = data[i + 1][2];
        tmp.coreElement = data[i + 1][3];
        tmp.dataElement = data[i + 1][4];
        if(tmp.dataElement == null){
            break;
        }
        tmp.elementValue = data[i + 1][5] === undefined ? "" : data[i+1][5].toString().trim();
        tmp.statisticType = data[i + 1][6];
        tmp.statisticValue = data[i + 1][7];
        tmp.status = 1;
        result.push(tmp);
    }
    return result;
};

extractHelper.insertOrUpdateDataResource = async (dataResourceInfo) => {
    let sql = "insert into data_resources (id, resource_name, resource_type, "
        +"description, resource_uri, site_owner, poc, poc_email, api, pediatric_specific, "
        +"analytics, visualization, data_content_type, initial_submission_date, data_update_date, suggested_next_data_update, status) "
        +"values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) on duplicate key update resource_name = VALUES(resource_name), resource_type = VALUES(resource_type), "
        +"description = VALUES(description), resource_uri = VALUES(resource_uri), site_owner = VALUES(site_owner), poc = VALUES(poc), poc_email = VALUES(poc_email), api = VALUES(api), pediatric_specific = VALUES(pediatric_specific), "
        +"analytics = VALUES(analytics), visualization = VALUES(visualization), data_content_type = VALUES(data_content_type), initial_submission_date = VALUES(initial_submission_date), data_update_date=VALUES(data_update_date), suggested_next_data_update=VALUES(suggested_next_data_update), update_time = now()";
    
    
    let inserts = [
        dataResourceInfo.id,dataResourceInfo.resourceName,dataResourceInfo.resourceType,dataResourceInfo.description,dataResourceInfo.resourceUri,
        dataResourceInfo.siteOwner,dataResourceInfo.poc,dataResourceInfo.pocEmail,dataResourceInfo.api,dataResourceInfo.pediatricSpecific,
        dataResourceInfo.analytics,dataResourceInfo.visualization,dataResourceInfo.dataContentType,
        dataResourceInfo.initialSubmissionDate,dataResourceInfo.dataUpdateDate,dataResourceInfo.suggestedNextDataUpdate,dataResourceInfo.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        await mysql.query(sql);
        logger.info("Inserted or Updated data resource: " + dataResourceInfo.id);
        return dataResourceInfo.id;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertSubmission = async (dataSubmissionInfo) => {
    let sql = "insert into submissions (submission_date, resource_id, submission_type, submission_poc, status) "
        +"values (?,?,?,?,?)";
    
    
    let inserts = [
        dataSubmissionInfo.submissionDate, dataSubmissionInfo.resourceId, dataSubmissionInfo.submissionType, dataSubmissionInfo.submissionPoc,dataSubmissionInfo.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        logger.info("Created new submission record : " + result.insertId);
        return result.insertId;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertDataset = async (datasetInfo) => {
    let sql = "insert into datasets (submission_id, dataset_name, dataset_full_name, description, dataset_scope, poc, poc_email, published_in, status) "
        +"values (?,?,?,?,?,?,?,?,?)";
    
    
    let inserts = [
        datasetInfo.submissionId, datasetInfo.datasetName, datasetInfo.datasetFullName, datasetInfo.description, datasetInfo.datasetScope, datasetInfo.poc, datasetInfo.pocEmail, datasetInfo.publishedIn, datasetInfo.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        return result.insertId;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertDigest = async (digest) => {
    let sql = "insert into digests (dataset_id, parent_digest_level, digest_level, core_element, data_element, element_value, statistic_type, statistic_value, status) "
        +"values (?,?,?,?,?,?,?,?,?)";
    
    
    let inserts = [
        digest.datasetId, digest.parentDigestLevel, digest.digestLevel, digest.coreElement, digest.dataElement, digest.elementValue, digest.statisticType, digest.statisticValue, digest.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        return result.insertId;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertGlossary = async (glossary) => {
  let sql = "insert into glossary (term_category, term_name, definition, reference) "
        +"values (?,?,?,?)";
    
    
    let inserts = [
      glossary.termCategory, glossary.termName, glossary.definition, glossary.reference
    ];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        return result.insertId;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.deleteAllGlossary = async () => {
  let sql = "delete from glossary";
  
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

extractHelper.getSiteChangeLogInfo = (siteChangeLogSheet) => {
    let result = [];
    let data = siteChangeLogSheet;
    let len = data.length - 1;
    for(let i = 0; i < len; i++){
        let tmp = {};
        tmp.logType = data[i+1][0] === "promotional" ? 0 : 1;
        if(tmp.logType == null){
            break;
        }
        tmp.title = data[i+1][1];
        // tmp.postDate = utils.ExcelDateToJSDate(data[i+1][2]);
        tmp.postDate = data[i+1][2] === undefined ? "" : data[i+1][2].trim();
        tmp.contentType = data[i+1][3] === undefined ? "" : data[i+1][3].trim();
        tmp.description = data[i+1][4] === undefined ? "" : data[i+1][4].trim();
        tmp.details = data[i+1][5] === undefined ? "" : data[i+1][5].trim();
        tmp.status = 1;
        result.push(tmp);
    }
    return result;
};

extractHelper.deleteAllSiteChangeLog = async () => {
    let sql = "delete from changelog";

    try{
        const result = await mysql.query(sql);
        return result;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertSiteChangeLog = async (siteChangeLog) => {
    let sql = "insert into changelog (log_type, title, post_date, content_type, description, details, status) "
        +"values (?,?,?,?,?,?,?)";
    
    let inserts = [
        siteChangeLog.logType, siteChangeLog.title, siteChangeLog.postDate, siteChangeLog.contentType, siteChangeLog.description, siteChangeLog.details, siteChangeLog.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        return result.insertId;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

module.exports = extractHelper;