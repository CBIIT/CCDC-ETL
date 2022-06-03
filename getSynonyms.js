const config = require("./config");
const logger = require("./common/logger");
const fs = require("fs");
const path = require("path");
const {
  fetch,
  readNCItDiseaseTerms,
  readNCItTumorSiteTerms,
} = require('./common/utils');

const getDiseaseSynonyms = async function(){
  let output_file_path = path.join(__dirname, 'data_files', 'ncit_disease_synonyms.json');
  const diseaseTerms = readNCItDiseaseTerms();
  let synonyms = {};
  const keys = Object.keys(diseaseTerms);
  for(let k = 0 ; k < keys.length; k++){
    const t = keys[k];
    logger.info("Getting disease synonyms for term: " + t + " - "+ diseaseTerms[t]);
    let d = await fetch(config.ncitAPI + diseaseTerms[t]);
    const syns = [];
    d.synonyms.map((syn) => {
      if (syns.indexOf(syn.name) === -1 && syn.source && syn.source === "NCI") {
        syns.push(syn.name);
      }
    });
    synonyms[t.trim().toLowerCase()] = syns;
  }

  fs.writeFileSync(output_file_path, JSON.stringify(synonyms), err => {
		if (err) return logger.error(err);
	});
};

const getTumorSiteSynonyms = async function(){
  let output_file_path = path.join(__dirname, 'data_files', 'ncit_tumor_site_synonyms.json');
  const tumorSiteTerms = readNCItTumorSiteTerms();
  let synonyms = {};
  const keys = Object.keys(tumorSiteTerms);
  for(let k = 0 ; k < keys.length; k++){
    const t = keys[k];
    logger.info("Getting tumor site synonyms for term: " + t + " - "+ tumorSiteTerms[t]);
    let d = await fetch(config.ncitAPI + tumorSiteTerms[t]);
    const syns = [];
    d.synonyms.map((syn) => {
      if (syns.indexOf(syn.name) === -1 && syn.source && syn.source === "NCI") {
        syns.push(syn.name);
      }
    });
    synonyms[t.trim().toLowerCase()] = syns;
  }

  fs.writeFileSync(output_file_path, JSON.stringify(synonyms), err => {
		if (err) return logger.error(err);
	});
};

getDiseaseSynonyms();
getTumorSiteSynonyms();
