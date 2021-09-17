/**
 * client for mysql
 */

 "use strict";
 var config = require("../config");
 var logger = require("../common/logger");
 var extract = require("./extract");
 var buildIndex = require("./buildIndex");
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
 
 module.exports = etl;