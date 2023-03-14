/**
 * client for mysql
 */

 "use strict";
 var config = require("../config");
 var logger = require("../common/logger");
 var validate = require("./validate");
 var extract = require("./extract");
 var buildIndex = require("./buildIndex");
 var createTables = require("./createTables");
 var dropTables = require("./dropTables");
 var reporting = require("./reporting");
 var exporting = require("./exporting");
 var load = require("./load");
 var mysql = require("../common/mysql");
 
 var etl = {};
 
 etl.startEtl = async () => {
   logger.info("Validating digest files...");
   const result = await validate.run();
   if (result) {
      logger.info("Successful in validating digest files.");
      await extract.run();
      await buildIndex.run();
      await load.run();
   } else {
      logger.error("validating digest files failed:");
   }
 };
 
 etl.endEtl = () => {
    logger.info("Finished ETL process.");
    mysql.close();
 };

 etl.createDBTables = async () => {
    logger.info("Start creating tables into Relational Database.");
    await createTables.run();
 };

 etl.finishedTableCreation = () => {
  mysql.close();
};

etl.dropDBTables = async () => {
  logger.info("Droping tables in Relational Database.");
  await dropTables.run();
};

etl.finishedDropTables = () => {
   mysql.close();
};

etl.reportNextDataUpdate = async () => {
   logger.info("Reporting suggested next data update for CCDC digest.");
   await reporting.run();
};

etl.finishedReportNextDataUpdate = () => {
   mysql.close();
};

etl.exportDatasets = async () => {
   await exporting.run();
};

etl.finishedExportDatasets = () => {
   mysql.close();
};
 
 module.exports = etl;