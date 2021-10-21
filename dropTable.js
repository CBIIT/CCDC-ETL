const config = require("./config");
const logger = require("./common/logger");
const mysql = require("./common/mysql");
const etl = require("./etl");

const dropCCDCRDBTables = async function(){
  
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

    await etl.dropDBTables();
    etl.finishedDropTables();
};

dropCCDCRDBTables();
