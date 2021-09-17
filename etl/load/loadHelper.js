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

module.exports = loadHelper;