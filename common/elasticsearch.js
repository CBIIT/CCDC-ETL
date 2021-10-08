/**
 * Client for elasticsearch
 */
const { Client } = require("@elastic/elasticsearch");
const logger = require("./logger");
const config = require("../config");
const { uniqueId } = require("lodash");
 
const esClient = new Client({
    node: config.elasticsearch.host,
    requestTimeout: config.elasticsearch.requestTimeout
});
 
const testConnection = async () => {
    const info = await esClient.ping();
    return info;
};

exports.testConnection = testConnection;

const search = async (indexName, query) => {
    const result = await esClient.search({
        index: indexName,
        body: query
    });

    return result.body.hits.hits;
};

exports.search = search;

const createIndex = async (indexName, indexConfig) => {
  await esClient.indices.create({
    index: indexName,
    body: indexConfig
  });
};

exports.createIndex = createIndex;

const getAliases = async (aliasNames) => {
  const result = await esClient.cat.aliases({ format: "json", name: aliasNames });
  return result.body;
};

exports.getAliases = getAliases;

const removeIndices = async (indexNames) => {
  await esClient.indices.delete({
    index: indexNames
  });
};

exports.removeIndices = removeIndices;

const addIndicesToAliases = async (indexNames, aliasNames) => {
  for(let i = 0; i < indexNames.length ; i++){
    await esClient.indices.putAlias({
      index: indexNames[i],
      name: aliasNames[i]
    });
  }
};

exports.addIndicesToAliases = addIndicesToAliases;

const addDocument = async (indexName, uid, document) => {
  const result = await esClient.create({
    id: uid,  
    index: indexName,
    body: document
  });
  return result.body;
};

exports.addDocument = addDocument;

