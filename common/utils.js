const path = require('path');
const fs = require("fs");
const axios = require('axios');

const fetch = async (url) => {
  try {
      const response = await axios.get(url, {timeout: 60000, clarifyTimeoutError: false})
      return response.data;
  } catch (error) {
      return "failed";
  }
};

const dataFilesDir = path.join(__dirname, '..', "data_files");

const readNCItTerms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_terms.json").toString();
  return JSON.parse(content);
};

const readNCItSynonyms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_synonyms.json").toString();
  return JSON.parse(content);
};

module.exports = {
	fetch,
  readNCItTerms,
  readNCItSynonyms,
};