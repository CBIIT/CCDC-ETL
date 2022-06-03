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

const readNCItDiseaseTerms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_disease_terms.json").toString();
  return JSON.parse(content);
};

const readNCItTumorSiteTerms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_tumor_site_terms.json").toString();
  return JSON.parse(content);
};

const readNCItDiseaseSynonyms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_disease_synonyms.json").toString();
  return JSON.parse(content);
};

const readNCItTumorSiteSynonyms = () => {
  let content = fs.readFileSync(dataFilesDir + "/ncit_tumor_site_synonyms.json").toString();
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
      tmp.reference = ( data[i+1][3] === undefined ? "" : data[i+1][3] ) + " " + ( data[i+1][4] === undefined ? "" : data[i+1][4] );
      result.push(tmp);
  }
  return result;
};

const getTodayDate = () => {
  const date = new Date();
  let str = "";
  const month = date.getMonth();
  if (month < 9) {
    str += `0${month + 1}`;
  } else {
    str += (month + 1).toString();
  }
  str += '/';
  const day = date.getDate();
  if (day < 10) {
    str += `0${day}`;
  } else {
    str += day.toString();
  }
  str += `/${date.getFullYear()}`;
  return str;
};

const timestampToString = (ts) => {
  const date = new Date(ts);
  let str = "";
  const month = date.getMonth();
  if (month < 9) {
    str += `0${month + 1}`;
  } else {
    str += (month + 1).toString();
  }
  str += '/';
  const day = date.getDate();
  if (day < 10) {
    str += `0${day}`;
  } else {
    str += day.toString();
  }
  str += `/${date.getFullYear()}`;
  return str;
};

const ExcelDateToJSDate = (serial) => {
  if (serial === undefined) {
    return null;
  }
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date = new Date(utc_value * 1000);
  return date.toISOString().substring(0, 10);
};

const ExcelDateToJSDateTime = (serial) => {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  const total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;

  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
};

module.exports = {
	fetch,
  readNCItDiseaseTerms,
  readNCItTumorSiteTerms,
  readNCItDiseaseSynonyms,
  readNCItTumorSiteSynonyms,
  readGlossary,
  getTodayDate,
  timestampToString,
  ExcelDateToJSDate,
  ExcelDateToJSDateTime,
};