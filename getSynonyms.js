const config = require("./config");
const logger = require("./common/logger");
const fs = require("fs");
const path = require("path");
const {
  fetch,
  readNCItTerms,
} = require('./common/utils');

const getSynonyms = async function(){
  let output_file_path = path.join(__dirname, 'data_files', 'ncit_synonyms.json');
  const terms = readNCItTerms();
  let synonyms = {};
  const keys = Object.keys(terms);
  for(let k = 0 ; k < keys.length; k++){
    const t = keys[k];
    logger.info("Getting synonyms for term: " + t + " - "+ terms[t]);
    let d = await fetch(config.ncitAPI + terms[t]);
    const syns = [];
    d.synonyms.map((syn) => {
      if (syns.indexOf(syn.name) === -1) {
        syns.push(syn.name);
      }
    });
    synonyms[t.trim().toLowerCase()] = syns;
  }

  fs.writeFileSync(output_file_path, JSON.stringify(synonyms), err => {
		if (err) return logger.error(err);
	});
};

getSynonyms();
