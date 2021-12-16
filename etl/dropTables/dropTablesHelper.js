const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
let dropTablesHelper = {};

dropTablesHelper.dropDataResourcesTable = async () => {
    let sql = "DROP TABLE data_resources";
    sql = mysql.format(sql, []);
    try{
        await mysql.query(sql);
        return 1;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

dropTablesHelper.dropSubmissionsTable = async () => {
  let sql = "DROP TABLE submissions";
  sql = mysql.format(sql, []);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

dropTablesHelper.dropDatasetsTable = async () => {
  let sql = "DROP TABLE datasets";
  sql = mysql.format(sql, []);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

dropTablesHelper.dropDigestsTable = async () => {
  let sql = "DROP TABLE digests";
  sql = mysql.format(sql, []);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

dropTablesHelper.dropAggragationTable = async () => {
  let sql = "DROP TABLE aggragation";
  sql = mysql.format(sql, []);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

dropTablesHelper.dropGlossaryTable = async () => {
  let sql = "DROP TABLE glossary";
  sql = mysql.format(sql, []);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

module.exports = dropTablesHelper;