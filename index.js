// Elasticsearch indexing temporarily disabled — RDB write only
// const config = require("./config");
const logger = require("./common/logger");
const mysql = require("./common/mysql");
// Elasticsearch indexing temporarily disabled — RDB write only
// const elasticsearch = require("./common/elasticsearch");
const etl = require("./etl");

const runCCDCETL = async function(){
    // Elasticsearch connection check temporarily disabled — RDB write only
    /*
    try {
        logger.info(
            "Testing Elasticsearch connection "
            + `(ping timeout: ${config.elasticsearch.pingTimeout} ms, `
            + `request timeout: ${config.elasticsearch.requestTimeout} ms, `
            + `max retries: ${config.elasticsearch.maxRetries}).`
        );
        const elasticsearchConnected = await elasticsearch.testConnection();
        if(elasticsearchConnected){
            logger.info("Elasticsearch connected!");
        }
        else{
            throw new Error("Failed to connect to Elasticsearch.");
        }
    }
    catch(error) {
        logger.error(error);
        process.exitCode = 1;
        return;
    }
    */
  
    try{
        const mysqlConnected = await mysql.query("select 1 as c1");
        if(mysqlConnected[0].c1){
            logger.info("Relational DB connected!");
        }
        else{
            throw new Error("Failed to connect to Relational Database.");
        }
    }
    catch(error) {
        logger.error(error);
        process.exitCode = 1;
        return;
    }

    const etlSucceeded = await etl.startEtl();
    etl.endEtl();
    if (!etlSucceeded) {
        process.exitCode = 1;
    }
};

runCCDCETL();
