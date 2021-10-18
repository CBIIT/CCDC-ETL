const logger = require("../../common/logger");
const createTablesHelper = require("./createTablesHelper");

var createTables = {};

createTables.run = async () => {
  //create relational database tables
  let result = await createTablesHelper.createDataResourcesTable();
  if(result === 1){
    logger.info("Table <data resources> created.");
  }

  result = await createTablesHelper.createSubmissionsTable();
  if(result === 1){
    logger.info("Table <submissions> created.");
  }

  result = await createTablesHelper.createDatasetsTable();
  if(result === 1){
    logger.info("Table <datasets> created.");
  }

  result = await createTablesHelper.createDigestsTable();
  if(result === 1){
    logger.info("Table <digests> created.");
  }

  result = await createTablesHelper.createAggragationTable();
  if(result === 1){
    logger.info("Table <aggragation> created.");
  }

  result = await createTablesHelper.createLUTermsTable();
  if(result === 1){
    logger.info("Table <lu_terms> created.");
  }

  result = await createTablesHelper.createLUValueSetTable();
  if(result === 1){
    logger.info("Table <lu_value_set> created.");
  }

};

module.exports = createTables;