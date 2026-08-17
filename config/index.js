let path = require("path");
let localEnv = require("dotenv");
let _ = require("lodash");
const { preferDeployedValue } = require("./environment");

const deployedEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DIGEST_FILE_FOLDER: process.env.DIGEST_FILE_FOLDER,
    LOGDIR: process.env.LOGDIR,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RDB_HOST: process.env.RDB_HOST,
    RDB_USER: process.env.RDB_USER,
    RDB_PASSWORD: process.env.RDB_PASSWORD,
    RDB_NAME: process.env.RDB_NAME,
    ES_HOST: process.env.ES_HOST,
    ES_REQUEST_TIMEOUT: process.env.ES_REQUEST_TIMEOUT,
    ES_PING_TIMEOUT: process.env.ES_PING_TIMEOUT,
    ES_MAX_RETRIES: process.env.ES_MAX_RETRIES,
    SITE_ANNOUNCEMENT_URL: process.env.SITE_ANNOUNCEMENT_URL,
};
const cfg = localEnv.config();
if (!cfg.error) {
    let tmp = cfg.parsed;
    process.env = {
        ...process.env,
        NODE_ENV: preferDeployedValue(deployedEnv.NODE_ENV, tmp.NODE_ENV),
        DIGEST_FILE_FOLDER: preferDeployedValue(deployedEnv.DIGEST_FILE_FOLDER, tmp.DIGEST_FILE_FOLDER),
        LOGDIR: preferDeployedValue(deployedEnv.LOGDIR, tmp.LOGDIR),
        LOG_LEVEL: preferDeployedValue(deployedEnv.LOG_LEVEL, tmp.LOG_LEVEL),
        RDB_HOST: preferDeployedValue(deployedEnv.RDB_HOST, tmp.RDB_HOST),
        RDB_USER: preferDeployedValue(deployedEnv.RDB_USER, tmp.RDB_USER),
        RDB_PASSWORD: preferDeployedValue(deployedEnv.RDB_PASSWORD, tmp.RDB_PASSWORD),
        RDB_NAME: preferDeployedValue(deployedEnv.RDB_NAME, tmp.RDB_NAME),
        ES_HOST: preferDeployedValue(deployedEnv.ES_HOST, tmp.ES_HOST),
        ES_REQUEST_TIMEOUT: preferDeployedValue(deployedEnv.ES_REQUEST_TIMEOUT, tmp.ES_REQUEST_TIMEOUT),
        ES_PING_TIMEOUT: preferDeployedValue(deployedEnv.ES_PING_TIMEOUT, tmp.ES_PING_TIMEOUT),
        ES_MAX_RETRIES: preferDeployedValue(deployedEnv.ES_MAX_RETRIES, tmp.ES_MAX_RETRIES),
        SITE_ANNOUNCEMENT_URL: preferDeployedValue(
          deployedEnv.SITE_ANNOUNCEMENT_URL,
          tmp.SITE_ANNOUNCEMENT_URL
        ),
    };
}

// All configurations will extend these options
// ============================================
var config = {
  // Root path of server
  root: path.resolve(__dirname, "../../"),

  digestFileFolder: process.env.DIGEST_FILE_FOLDER || path.resolve(__dirname, "../digests"),

  siteAnnouncementUrl: process.env.SITE_ANNOUNCEMENT_URL,

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
		requestTimeout: Number(process.env.ES_REQUEST_TIMEOUT || 30000),
		pingTimeout: Number(process.env.ES_PING_TIMEOUT || 10000),
		maxRetries: Number(process.env.ES_MAX_RETRIES || 0)
  },

  //NCIt synonyms API
  ncitAPI: "https://api-evsrest.nci.nih.gov/api/v1/concept/ncit/",

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(config, {});