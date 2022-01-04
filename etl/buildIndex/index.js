const config = require("../../config");
const logger = require("../../common/logger");
const elasticsearch = require("../../common/elasticsearch");
const { dataresourcesIndexConfig , datasetsIndexConfig , documentsIndexConfig } = require("./indices.config");

var buildIndex = {};

buildIndex.run = async () => {
  //create new indices for data resources and datasets
  let ts = Date.now();
  let dataresourcesIndexName = config.indexDR.prefix + ts;
  let datasetsIndexName = config.indexDS.prefix + ts;
  let documentsIndexName = config.indexDoc.prefix + ts;
  await elasticsearch.createIndex(datasetsIndexName, datasetsIndexConfig);
  logger.info("Created datasets index : " + datasetsIndexName);
  await elasticsearch.createIndex(dataresourcesIndexName, dataresourcesIndexConfig);
  logger.info("Created data resources index : " + dataresourcesIndexName);
  await elasticsearch.createIndex(documentsIndexName, documentsIndexConfig);
  logger.info("Created documents index : " + documentsIndexName);
  //find out the alias of the index
  let aliasExists = await elasticsearch.getAliases([config.indexDR.alias, config.indexDS.alias, config.indexDoc.alias]);
  if(aliasExists.length > 0){
    //if exists, remove the old indices out of the alias
    let oldIndices = [];
    aliasExists.map((item) => {
      if(oldIndices.indexOf(item.index) == -1){
        oldIndices.push(item.index);
      }
    });
    await elasticsearch.removeIndices(oldIndices);
    logger.info("Removed old indices : " + oldIndices);
    //await elasticsearch.addIndicesToAliases([dataresoucesIndexName, datasetsIndexName], [config.indexDR.alias, config.indexDS.alias]);
  }
  //add the new indices into the alias
  await elasticsearch.addIndicesToAliases([dataresourcesIndexName, datasetsIndexName, documentsIndexName], [config.indexDR.alias, config.indexDS.alias, config.indexDoc.alias]);
  logger.info("Created aliases and pointed to indices : " + config.indexDR.alias + " ==> " + dataresourcesIndexName + " , " + config.indexDS.alias + " ==> " + datasetsIndexName + " , " + config.indexDoc.alias + " ==> " + documentsIndexName);
};

module.exports = buildIndex;