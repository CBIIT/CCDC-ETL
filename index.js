const config = require("./config");
const logger = require("./common/logger");
const mysql = require("./common/mysql");
const elasticsearch = require("./common/elasticsearch");
const etl = require("./etl");

const run_CCDC_ETL = async function(){

    try{
        const elasticsearchConnected = await elasticsearch.testConnection();
        if(elasticsearchConnected){
            logger.info("Elasticsearch connected!");
        }
        else{
            logger.info("Failed to connect to Elasticsearch.");
        }
    }
    catch(error) {
        logger.error(error);
    }
  

    try{
        const mysqlConnected = await mysql.query("select 1 as c1");
        if(mysqlConnected[0].c1){
            logger.info("Relational DB connected!");
        }
        else{
            logger.info("Failed to connect to Relational Database.");
        }
    }
    catch(error) {
        logger.error(error);
    }

    await etl.startEtl();
    etl.endEtl();
}

run_CCDC_ETL();
