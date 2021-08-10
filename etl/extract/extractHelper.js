const logger = require('../../common/logger');
const mysql = require('../../common/mysql');
let extractHelper = {};

extractHelper.getDataResourceInfo = (data_resource_sheet) => {
    let result = {};
    let data = data_resource_sheet.data;
    result.id = data[9][2];
    result.resource_name = data[9][3];
    result.resource_type = data[14][1];
    result.description = data[14][0];
    result.resource_uri = data[9][4];
    result.site_owner = "";
    result.poc = data[14][3];
    result.poc_email = data[14][4];
    result.api = data[14][8] == "No" ? "" : data[14][9];
    result.pediatric_specific = data[14][7] == "Mix" ? 0 : 1;
    result.analytics = data[14][5] == "Yes" ? 1 : 0;
    result.visualization = data[14][6] == "Yes" ? 1 : 0;
    result.has_genomics_omics = data[14][2].indexOf("genomics") > -1? 1 : 0;
    result.has_imaging_data = data[14][2].indexOf("imaging") > -1? 1 : 0;
    result.has_clinical_data = data[14][2].indexOf("clinical") > -1? 1 : 0;
    result.has_xenograft_data = data[14][2].indexOf("xenograft") > -1? 1 : 0;
    result.has_cell_lines_data = data[14][2].indexOf("cell") > -1? 1 : 0;
    result.status = 1;
    return result;
};

extractHelper.getDataSubmissionInfo = (data_resource_sheet) => {
    let result = {};
    let data = data_resource_sheet.data;
    let tmp = new Date(1900,0).setDate(data[9][0]);
    result.submission_date = new Date(tmp).toISOString().substring(0, 10);
    result.submission_poc = data[9][1];
    result.submission_type = 1;
    result.status = 1;
    return result;
};

extractHelper.getDatasetsInfo = (dataset_info_sheet) => {
    let result = [];
    let data = dataset_info_sheet.data;
    let len = data.length - 1;
    for(let i = 0; i < len; i++){
        let tmp = {};
        tmp.dataset_name = data[i+1][2];
        if(tmp.dataset_name == null){
            break;
        }
        tmp.description = data[i+1][3];
        tmp.dataset_scope = data[i+1][4];
        tmp.poc = data[i+1][5];
        tmp.poc_email = data[i+1][6];
        tmp.published_in = data[i+1][7];
        tmp.status = 1;
        result.push(tmp);
    }
    return result;
};

extractHelper.getDigest = (digest_sheet) => {
    let result = [];
    let data = digest_sheet.data;
    let len = data.length - 1;
    for(let i = 0; i< len; i++){
        let tmp = {};
        tmp.parent_digest_level = data[i + 1][1];
        tmp.digest_level = data[i + 1][2];
        tmp.core_element = data[i + 1][3];
        tmp.data_element = data[i + 1][4];
        if(tmp.data_element == null){
            break;
        }
        tmp.element_value = data[i + 1][5];
        tmp.statistic_type = data[i + 1][6];
        tmp.statistic_value = data[i + 1][7];
        tmp.status = 1;
        result.push(tmp);
    }
    return result;
};

extractHelper.insertOrUpdateDataResource = async (data_resource_info) => {
    let sql = "insert into data_resources (id, resource_name, resource_type, "
        +"description, resource_uri, site_owner, poc, poc_email, api, pediatric_specific, "
        +"analytics, visualization, has_genomics_omics, has_imaging_data, has_clinical_data, "
        +"has_xenograft_data, has_cell_lines_data, status) "
        +"values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) on duplicate key update resource_name = VALUES(resource_name), resource_type = VALUES(resource_type), "
        +"description = VALUES(description), resource_uri = VALUES(resource_uri), site_owner = VALUES(site_owner), poc = VALUES(poc), poc_email = VALUES(poc_email), api = VALUES(api), pediatric_specific = VALUES(pediatric_specific), "
        +"analytics = VALUES(analytics), visualization = VALUES(visualization), has_genomics_omics = VALUES(has_genomics_omics), has_imaging_data = VALUES(has_imaging_data), has_clinical_data = VALUES(has_clinical_data), "
        +"has_xenograft_data = VALUES(has_xenograft_data), has_cell_lines_data = VALUES(has_cell_lines_data), update_time = now()";
    
    
    let inserts = [
        data_resource_info.id,data_resource_info.resource_name,data_resource_info.resource_type,data_resource_info.description,data_resource_info.resource_uri,
        data_resource_info.site_owner,data_resource_info.poc,data_resource_info.poc_email,data_resource_info.api,data_resource_info.pediatric_specific,
        data_resource_info.analytics,data_resource_info.visualization,data_resource_info.has_genomics_omics,data_resource_info.has_imaging_data,
        data_resource_info.has_clinical_data,data_resource_info.has_xenograft_data,data_resource_info.has_cell_lines_data,data_resource_info.status
    ];
    sql = mysql.format(sql, inserts);
    try{
        await mysql.query(sql);
        logger.info("Inserted or Updated data resource: " + data_resource_info.id);
        return data_resource_info.id;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

extractHelper.insertSubmission = async (data_submission_info) => {
    let sql = "insert into submissions (submission_date, resource_id, submission_type, submission_poc, status) "
        +"values (?,?,?,?,?)";
    
    
    let inserts = [
        data_submission_info.submission_date, data_submission_info.resource_id, data_submission_info.submission_type, data_submission_info.submission_poc,data_submission_info.status
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

extractHelper.insertDataset = async (dataset_info) => {
    let sql = "insert into datasets (submission_id, dataset_name, description, dataset_scope, poc, poc_email, published_in, status) "
        +"values (?,?,?,?,?,?,?,?)";
    
    
    let inserts = [
        dataset_info.submission_id, dataset_info.dataset_name, dataset_info.description, dataset_info.dataset_scope, dataset_info.poc, dataset_info.poc_email, dataset_info.published_in, dataset_info.status
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
        digest.dataset_id, digest.parent_digest_level, digest.digest_level, digest.core_element, digest.data_element, digest.element_value, digest.statistic_type, digest.statistic_value, digest.status
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