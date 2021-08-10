let path = require("path");
let local_env = require("dotenv")
let _ = require("lodash");

const cfg = local_env.config();
if (!cfg.error) {
    let tmp = cfg.parsed;
    process.env = {
        ...process.env,
        NODE_ENV: tmp.NODE_ENV,
        DIGEST_FILE_FOLDER: tmp.DIGEST_FILE_FOLDER,
        LOGDIR: tmp.LOGDIR,
        LOG_LEVEL: tmp.LOG_LEVEL,
        RDB_HOST: tmp.RDB_HOST,
        RDB_PORT: tmp.RDB_PORT,
        RDB_USER: tmp.RDB_USER,
        RDB_PASSWORD: tmp.RDB_PASSWORD,
        ES_HOST: tmp.ES_HOST,
        ES_PORT: tmp.ES_PORT,
    };
}

// All configurations will extend these options
// ============================================
var config = {
  // Root path of server
  root: path.resolve(__dirname, "../../"),

  digest_file_folder: process.env.DIGEST_FILE_FOLDER || path.resolve(__dirname, "../digests"),

  // Log directory
  logDir: process.env.LOGDIR || "/local/content/ccdc/etl/logs",

  // Node environment (dev, test, stage, prod), must select one.
  env: process.env.NODE_ENV || "prod",

  // Used by winston logger
  log_level: process.env.LOG_LEVEL || 'silly',

  // index name for data resource
  index_dr: "data_resource",

  // index name for dataset
  index_ds: "dataset",

  //mysql connection
  mysql: {
    connectionLimit: 100, 
    host: process.env.RDB_HOST || 'localhost',
    port: process.env.RDB_PORT || 3306,
    user: process.env.RDB_USER || 'root', 
    password : process.env.RDB_PASSWORD || '123456', 
    db : 'ccdc'
  },

  //elasticsearch connection
  elasticsearch: {
    host: process.env.ES_HOST || '127.0.0.1',
    port: process.env.ES_PORT || 9200,
    log: 'error',
		requestTimeout: 30000
  },

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(config, {});