const logger = require("../../common/logger");
const mysql = require("../../common/mysql");

let loadHelper = {};

loadHelper.getDataResources = async () => {
  let sql = "select * from data_resources";
  
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getSubmissionUpToDate = async (dataResourceId) => {
  let sql = "select * from submissions where resource_id = ?";

  let inserts = [
    dataResourceId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getDatasets = async (submissionId) => {
  let sql = "select * from datasets where submission_id = ?";

  let inserts = [
    submissionId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getDigest = async (datasetId) => {
  let sql = "select * from digests where dataset_id = ?";

  let inserts = [
    datasetId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.deletePreviousAggratedData = async () => {
  let sql = "delete from aggragation";
  
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedData = async (submissionIDs) => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        +"select data_element, element_value, sum(1) from digests where core_element=1 and dataset_id in (select ds.id from datasets ds where ds.submission_id in ("
        +submissionIDs.join()+")) group by data_element, element_value";
    
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedDataForDataResource = async (submissionIDs) => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        +"select 'Resource', sub.resource_id, sum(1) from submissions sub, datasets ds where ds.submission_id = sub.id and sub.id in ("
        +submissionIDs.join()+") group by sub.resource_id";
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

module.exports = loadHelper;