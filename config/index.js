let path = require("path");
let localEnv = require("dotenv");
let _ = require("lodash");

const cfg = localEnv.config();
if (!cfg.error) {
    let tmp = cfg.parsed;
    process.env = {
        ...process.env,
        NODE_ENV: tmp.NODE_ENV,
        DIGEST_FILE_FOLDER: tmp.DIGEST_FILE_FOLDER,
        LOGDIR: tmp.LOGDIR,
        LOG_LEVEL: tmp.LOG_LEVEL,
        RDB_HOST: tmp.RDB_HOST,
        RDB_USER: tmp.RDB_USER,
        RDB_PASSWORD: tmp.RDB_PASSWORD,
        RDB_NAME: tmp.RDB_NAME,
        ES_HOST: tmp.ES_HOST,
    };
}

// All configurations will extend these options
// ============================================
var config = {
  // Root path of server
  root: path.resolve(__dirname, "../../"),

  digestFileFolder: process.env.DIGEST_FILE_FOLDER || path.resolve(__dirname, "../digests"),

  // Log directory
  logDir: process.env.LOGDIR || "/local/content/ccdc/etl/logs",

  // Node environment (dev, test, stage, prod), must select one.
  env: process.env.NODE_ENV || "prod",

  // Used by winston logger
  logLevel: process.env.LOG_LEVEL || "silly",

  // index name for data resource
  indexDR: {
    prefix: "dataresources_",
    alias: "dataresources"
  },

  // index name for dataset
  indexDS: {
    prefix: "datasets_",
    alias: "datasets"
  },

  // index name for ccdc documents
  indexDoc: {
    prefix: "documents_",
    alias: "documents"
  },

  //mysql connection
  mysql: {
    connectionLimit: 100, 
    host: process.env.RDB_HOST || "localhost",
    user: process.env.RDB_USER || "root", 
    password : process.env.RDB_PASSWORD || "123456", 
    db : process.env.RDB_NAME || "ccdc"
  },

  //elasticsearch connection
  elasticsearch: {
    host: process.env.ES_HOST || "http://127.0.0.1:9200",
		requestTimeout: 30000
  },

  //NCIt synonyms API
  ncitAPI: "https://api-evsrest.nci.nih.gov/api/v1/concept/ncit/",

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(config, {});