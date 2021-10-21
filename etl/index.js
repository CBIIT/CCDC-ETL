/**
 * client for mysql
 */

 "use strict";
 var config = require("../config");
 var logger = require("../common/logger");
 var extract = require("./extract");
 var buildIndex = require("./buildIndex");
 var createTables = require("./createTables");
 var dropTables = require("./dropTables");
 var load = require("./load");
 var mysql = require("../common/mysql");
 
 var etl = {};
 
 etl.startEtl = async () => {
    await extract.run();
    await buildIndex.run();
    await load.run();
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
 
 module.exports = etl;