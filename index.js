const config = require('./config');
const logger = require('./common/logger');
const mysql = require('./common/mysql');
const elasticsearch = require('./common/elasticsearch');
const etl = require('./etl');

const run_CCDC_ETL = async function(){

    try{
        const elasticsearch_connected = await elasticsearch.testConnection();
        if(elasticsearch_connected){
            logger.info('Elasticsearch connected!');
        }
        else{
            logger.info('Failed to connect to Elasticsearch.');
        }
    }
    catch(error) {
        logger.error(error);
    }
  

    try{
        const mysql_connected = await mysql.query('select 1 as c1');
        if(mysql_connected[0].c1){
            logger.info('Relational DB connected!');
        }
        else{
            logger.info('Failed to connect to Relational Database.');
        }
    }
    catch(error) {
        logger.error(error);
    }

    await etl.start_etl();
    etl.end_etl();
}

run_CCDC_ETL();
