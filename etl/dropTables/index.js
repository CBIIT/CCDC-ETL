const logger = require("../../common/logger");
const dropTablesHelper = require("./dropTablesHelper");

var dropTables = {};

dropTables.run = async () => {
  //drop relational database tables
  let result = await dropTablesHelper.dropAggragationTable();
  if(result === 1){
    logger.info("Table <aggragation> droped.");
  }
  
  result = await dropTablesHelper.dropDigestsTable();
  if(result === 1){
    logger.info("Table <digests> droped.");
  }

  result = await dropTablesHelper.dropDatasetsTable();
  if(result === 1){
    logger.info("Table <datasets> droped.");
  }

  result = await dropTablesHelper.dropSubmissionsTable();
  if(result === 1){
    logger.info("Table <submissions> droped.");
  }

  result  = await dropTablesHelper.dropDataResourcesTable();
  if(result === 1){
    logger.info("Table <data resources> droped.");
  }

};

module.exports = dropTables;