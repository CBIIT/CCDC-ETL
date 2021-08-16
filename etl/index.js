/**
 * client for mysql
 */

 'use strict';
 var config = require('../config');
 var logger = require('../common/logger');
 var extract = require('./extract');
 var transform = require('./transform');
 var load = require('./load');
 var mysql = require('../common/mysql');
 
 var etl = {};
 
 etl.start_etl = async () => {
    await extract.run();
    transform.run();
    load.run();
 };
 
 etl.end_etl = () => {
    logger.info('Finished ETL process.');
    mysql.close();
 };
 
 module.exports = etl;