const path = require('path');
const fs = require("fs");
const axios = require('axios');
const xlsx = require("node-xlsx").default;

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

const readGlossary = () => {
  const glossarySheets = xlsx.parse(`${dataFilesDir}/Glossary.xlsm`);
  let result = [];
  let data = glossarySheets[0].data;
  let len = data.length - 1;
  for(let i = 0; i < len; i++){
      let tmp = {};
      tmp.termCategory = data[i+1][0];
      if(tmp.termCategory == null){
          break;
      }
      tmp.termName = data[i+1][1];
      tmp.definition = data[i+1][2];
      tmp.reference = data[i+1][3];
      result.push(tmp);
  }
  return result;
};

module.exports = {
	fetch,
  readNCItTerms,
  readNCItSynonyms,
  readGlossary,
};