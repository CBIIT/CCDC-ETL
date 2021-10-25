const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
let createTablesHelper = {};

createTablesHelper.createDataResourcesTable = async () => {
    let sql = "CREATE TABLE data_resources (id varchar(30) NOT NULL, " +
     "resource_name varchar(100) NOT NULL, " +
     "resource_type varchar(45) NOT NULL, " +
     "description varchar(2000) DEFAULT NULL, " +
     "resource_uri varchar(400) DEFAULT NULL, " +
     "site_owner varchar(200) DEFAULT NULL, " +
     "poc varchar(100) DEFAULT NULL, " +
     "poc_email varchar(200) DEFAULT NULL, " +
     "api varchar(500) DEFAULT NULL, " +
     "pediatric_specific int(1) NOT NULL, " +
     "analytics int(1) NOT NULL, " +
     "visualization int(1) NOT NULL, " +
     "has_genomics_omics int(1) NOT NULL, " +
     "has_imaging_data int(1) NOT NULL, " +
     "has_clinical_data int(1) NOT NULL, " +
     "has_xenograft_data int(1) NOT NULL, " +
     "has_cell_lines_data int(1) NOT NULL, " +
     "create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
     "update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
     "status int(1) NOT NULL, " +
     "PRIMARY KEY (id) " +
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    
    
    let createParams = [];
    sql = mysql.format(sql, createParams);
    try{
        await mysql.query(sql);
        return 1;
    }
    catch(error){
        logger.error(error);
        return -1;
    }
};

createTablesHelper.createSubmissionsTable = async () => {
  let sql = "CREATE TABLE submissions (" +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "submission_date datetime NOT NULL, " +
    "resource_id varchar(30) NOT NULL, " +
    "submission_type int(1) NOT NULL COMMENT '1 - manual\n2 - api', " +
    "submission_poc varchar(100) DEFAULT NULL, " +
    "create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
    "status int(1) NOT NULL, " +
    "PRIMARY KEY (id), " +
    "KEY submission_4_data_resource_idx (resource_id), " +
    "CONSTRAINT submission_4_data_resource FOREIGN KEY (resource_id) REFERENCES data_resources (id) ON DELETE NO ACTION ON UPDATE NO ACTION " +
    ") ENGINE=InnoDB AUTO_INCREMENT=296 DEFAULT CHARSET=utf8;";
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

createTablesHelper.createDatasetsTable = async () => {
  let sql = "CREATE TABLE datasets (" +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "submission_id int(11) NOT NULL, " +
    "dataset_name varchar(100) NOT NULL, " +
    "dataset_full_name varchar(300) NOT NULL, " +
    "description varchar(2000) DEFAULT NULL, " +
    "dataset_scope varchar(40) DEFAULT NULL, " +
    "poc varchar(100) DEFAULT NULL, " +
    "poc_email varchar(200) DEFAULT NULL, " +
    "published_in varchar(200) DEFAULT NULL, " +
    "create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
    "status int(1) NOT NULL, " +
    "PRIMARY KEY (id), " +
    "KEY dataset_4_submission_idx (submission_id), " +
    "CONSTRAINT dataset_4_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE NO ACTION ON UPDATE NO ACTION " +
    ") ENGINE=InnoDB AUTO_INCREMENT=1019 DEFAULT CHARSET=utf8;";
    
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

createTablesHelper.createDigestsTable = async () => {
  let sql = "CREATE TABLE digests ( " +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "dataset_id int(11) NOT NULL, " +
    "parent_digest_level varchar(10) NOT NULL, " +
    "digest_level varchar(10) NOT NULL, " +
    "core_element int(1) NOT NULL, " +
    "data_element varchar(45) NOT NULL, " +
    "element_value varchar(400) NOT NULL, " +
    "statistic_type varchar(20) NOT NULL, " +
    "statistic_value varchar(45) DEFAULT NULL, " +
    "create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
    "update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
    "status int(1) NOT NULL, " +
    "PRIMARY KEY (id), " +
    "KEY digest_4_dataset_idx (dataset_id), " +
    "CONSTRAINT digest_4_dataset FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE NO ACTION ON UPDATE NO ACTION " +
    ") ENGINE=InnoDB AUTO_INCREMENT=110250 DEFAULT CHARSET=utf8;";
    
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

createTablesHelper.createAggragationTable = async () => {
  let sql = "CREATE TABLE aggragation (" +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "data_element varchar(100) NOT NULL, " +
    "element_value varchar(500) NOT NULL, " +
    "dataset_count int(11) NOT NULL, " +
    "PRIMARY KEY (id) " +
    ") ENGINE=InnoDB AUTO_INCREMENT=45075 DEFAULT CHARSET=utf8;";
    
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

createTablesHelper.createLUTermsTable = async () => {
  let sql = "CREATE TABLE lu_terms (" +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "term_category varchar(45) NOT NULL, " +
    "term_name varchar(45) NOT NULL, " +
    "definition varchar(1000) DEFAULT NULL, " +
    "PRIMARY KEY (id) " +
  ") ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8;";
    
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

createTablesHelper.createLUValueSetTable = async () => {
  let sql = "CREATE TABLE lu_value_set (" +
    "id int(11) NOT NULL AUTO_INCREMENT, " +
    "term_id int(11) NOT NULL, " +
    "permissible_value varchar(200) NOT NULL, " +
    "ncit varchar(10) DEFAULT NULL, " +
    "definition varchar(2000) DEFAULT NULL, " +
    "PRIMARY KEY (id), " +
    "KEY value_2_term_idx (term_id), " +
    "CONSTRAINT value_2_term FOREIGN KEY (term_id) REFERENCES lu_terms (id) ON DELETE NO ACTION ON UPDATE NO ACTION " +
    ") ENGINE=InnoDB AUTO_INCREMENT=2446 DEFAULT CHARSET=utf8;";
    
    
  let createParams = [];
  sql = mysql.format(sql, createParams);
  try{
      await mysql.query(sql);
      return 1;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

module.exports = createTablesHelper;