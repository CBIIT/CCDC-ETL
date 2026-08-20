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
 var siteAnnouncement = require("../common/siteAnnouncement");
 
 var etl = {};
 
 const createStartEtl = ({
   appConfig = config,
   appLogger = logger,
   validator = validate,
   extractor = extract,
   indexBuilder = buildIndex,
   loader = load,
   announcementSource = siteAnnouncement,
 } = {}) => async () => {
   let siteAnnouncements;
   try {
      siteAnnouncements = await announcementSource.readSiteAnnouncements(appConfig.siteAnnouncementUrl);
   } catch (error) {
      appLogger.error(`Failed to load SITE_ANNOUNCEMENT_URL: ${error.message}`);
      return false;
   }

   appLogger.info("Validating digest files...");
   const result = await validator.run(siteAnnouncements);
   if (result) {
      appLogger.info("Successful in validating digest files.");
      try {
         await extractor.run(siteAnnouncements);
         // Elasticsearch index creation temporarily disabled — RDB write only
         // await indexBuilder.run();
         await loader.run();
         return true;
      } catch (error) {
         appLogger.error(`ETL failed: ${error.message}`);
         return false;
      }
   } else {
      appLogger.error("validating digest files failed:");
      return false;
   }
 };

 etl.startEtl = createStartEtl();
 etl.createStartEtl = createStartEtl;
 
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
   await exporting.runDatasets();
};

etl.finishedExportDatasets = () => {
   mysql.close();
};

etl.exportResources = async () => {
   await exporting.runResources();
};

etl.finishedExportResources = () => {
   mysql.close();
};
 
 module.exports = etl;
