const config = require("../../config");
const logger = require("../../common/logger");
const loadHelper = require("./loadHelper");
const { toNumber } = require("lodash");
const elasticsearch = require("../../common/elasticsearch");
const utils = require("../../common/utils");
const {
  readNCItDiseaseSynonyms,
  readNCItTumorSiteSynonyms,
} = require('../../common/utils');

var core_elements_1 = {
  "Case Age": "case_age",
  "Case Age at Diagnosis": "case_age_at_diagnosis",
  "Case Age at Trial": "case_age_at_trial",
  "Case Disease Diagnosis": "case_disease_diagnosis",
  "Case Ethnicity": "case_ethnicity",
  "Case Gender": "case_gender",
  "Case Proband": "case_proband",
  "Case Race": "case_race",
  "Case Sex": "case_sex",
  "Case Sex at Birth": "case_sex_at_birth",
  "Case Treatment Administered": "case_treatment_administered",
  "Case Treatment Outcome": "case_treatment_outcome",
  "Case Tumor Site": "case_tumor_site",
  "Donor Age": "donor_age",
  "Donor Disease": "donor_disease",
  "Donor Sex": "donor_sex",
  "Project Anatomic Site Studied": "project_anatomic_site_studied",
  "Project Cancer Studied": "project_cancer_studied",
  "Sample Analyte Type": "sample_analyte_type",
  "Sample Anatomic Site": "sample_anatomic_site",
  "Sample Assay Method": "sample_assay_method",
  "Sample Composition Type": "sample_composition_type",
  "Sample Is Cell Line": 'sample_is_cell_line',
  "Sample Is Normal": "sample_is_normal",
  "Sample Is Xenograft": "sample_is_xenograft",
  "Sample Repository Name": "sample_repository_name"
};
var core_elements_2 = {
  "Case ID": "case_id",
  "Cell Line ID": "cell_line_id",
  "Donor ID": "donor_id",
  "Program ID": "program_id",
  "Project ID": "project_id",
  "Sample ID": "sample_id"
};
var core_elements_3 = {
  "Program Name": "program_name",
  "Project Name": "project_name"
};
var load = {};

load.run = async () => {
  const drDocuments = [];
  const dsDocuments = [];
  //prepare NCIt synonyms data
  const diseaseSynonyms = readNCItDiseaseSynonyms();
  const tumorSiteSynonyms = utils.readNCItTumorSiteSynonyms();
  //get data resource list from table data_resources
  const drs = await loadHelper.getDataResources();
  const submissionIDs = [];
  //iterator on data resource
  for(let i = 0; i< drs.length; i++){
    logger.info("Start transforming and loading data into elasticsearch for data resource: " + drs[i].id);
    //pick the most up-to-date submission to process
    const submission = await loadHelper.getSubmissionUpToDate(drs[i].id);
    submissionIDs.push(submission[0].id);
    //get datasets basic info
    const datasets = await loadHelper.getDatasets(submission[0].id);
    for(let k = 0; k < datasets.length; k++){
      //get digest for each of the datasets
      let dataset = datasets[k];
      const digest = await loadHelper.getDigest(dataset.id);
      //transform datasets into json format
      let tmp = {};
      let has_partition = false;
      let partitionSet = {};
      tmp.data_resource_name = drs[i].id;
      tmp.data_resource_id = drs[i].id;
      //tmp.dataset_id = dataset.id;
      tmp.dataset_id = tmp.data_resource_id + "-" + dataset.dataset_name; 
      tmp.dataset_name = dataset.dataset_full_name;
      tmp.desc = dataset.description;
      tmp.primary_dataset_scope = dataset.dataset_scope;
      tmp.poc = dataset.poc;
      tmp.poc_email = dataset.poc_email;
      tmp.published_in = dataset.published_in;
      tmp.digest_type = submission[0].submission_type == "1" ? "manual" : "api";
      tmp.digest_date = dataset.create_time;
      let nonCoreElements = {};
      digest.map((row) => {
        if(row.core_element == 1){
          //processing core-elements
          
          if(row.digest_level.indexOf("_") == -1){
            if(core_elements_1[row.data_element]){
              let attributeName = core_elements_1[row.data_element];
              if(tmp[attributeName] == undefined){
                tmp[attributeName] = [];
              }
              tmp[attributeName].push({
                n: row.element_value,
                k: row.element_value,
                v: row.statistic_type == "Count" ? parseInt(row.statistic_value, 10) : -1
              });
            }
            else if(core_elements_2[row.data_element]){
              let attributeName = core_elements_2[row.data_element];
              tmp[attributeName] = parseInt(row.statistic_value, 10);
            }
            else if(core_elements_3[row.data_element]){
              let attributeName = core_elements_3[row.data_element];
              tmp[attributeName] = row.element_value;
            }
            else{
              logger.warn("Unknown core data element, will skip this row: " + row.data_element);
            }
          }
          else{
            has_partition = true;
            if(partitionSet[row.digest_level] == undefined){
              partitionSet[row.digest_level] = [];
            }
            partitionSet[row.digest_level].push(row);
          }
        }
        else{
          //processing non-core-elements
          let attributeName = row.data_element;
          if(nonCoreElements[attributeName] == undefined){
            nonCoreElements[attributeName] = [];
          }
          nonCoreElements[attributeName].push({
            k: row.element_value,
            v: row.statistic_type == "Count" ? parseInt(row.statistic_value, 10) : -1
          });
        }
      });

      //processing partition related digest
      if(has_partition && (tmp.primary_dataset_scope.toLowerCase() == "program" || tmp.primary_dataset_scope.toLowerCase() == "collection")){
        //only processing project level of partition at this point
        tmp.projects = [];
        for(let p in partitionSet) {
          let projectName = "";
          let attributeSet = [];
          partitionSet[p].map((entry) => {
            if(entry.data_element == "Project Name"){
              projectName = entry.element_value;
            }
            else{
              attributeSet.push({
                k: entry.data_element,
                v: entry.statistic_type == "Count" ? parseInt(entry.statistic_value, 10) : -1
              });
            }
          });
          if(projectName !== ""){
            let item = {};
            item.p_k = projectName;
            item.p_v = attributeSet.map((kvSet) => {
              return kvSet;
            });
            tmp.projects.push(item);
          }
        }
      }
      //processing non core elements
      if(Object.keys(nonCoreElements).length > 0){
        tmp.additional = [];
        for(let key in nonCoreElements){
          let entry = {};
          entry.attr_name = key;
          entry.attr_set = nonCoreElements[key];
          tmp.additional.push(entry);
        }
      }
      //add synonyms into the document for case disease dignosis
      if(tmp.case_disease_diagnosis) {
        tmp.case_disease_diagnosis.forEach((disease) => {
          const syn = diseaseSynonyms[disease.k.trim().toLowerCase()];
          if(syn) {
            disease.s = syn;
          }
        });
      }
      //add synonyms into the document for case tumor site
      if(tmp.case_tumor_site) {
        tmp.case_tumor_site.forEach((tumor) => {
          const syn = tumorSiteSynonyms[tumor.k.trim().toLowerCase()];
          if(syn) {
            tumor.s = syn;
          }
        });
      }
      //re-order core data element to be lower case alphabetic order
      if (tmp.case_disease_diagnosis) {
        tmp.case_disease_diagnosis.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_disease_diagnosis);
      }
      if (tmp.case_ethnicity) {
        tmp.case_ethnicity.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_ethnicity);
      }
      if (tmp.case_race) {
        tmp.case_race.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_race);
      }
      if (tmp.case_sex) {
        tmp.case_sex.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_sex);
      }
      if (tmp.case_sex_at_birth) {
        tmp.case_sex_at_birth.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_sex_at_birth);
      }
      if (tmp.case_treatment_administered) {
        tmp.case_treatment_administered.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_treatment_administered);
      }
      if (tmp.case_treatment_outcome) {
        tmp.case_treatment_outcome.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_treatment_outcome);
      }
      if (tmp.case_tumor_site) {
        tmp.case_tumor_site.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.case_tumor_site);
      }
      if (tmp.sample_analyte_type) {
        tmp.sample_analyte_type.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.sample_analyte_type);
      }
      if (tmp.sample_anatomic_site) {
        tmp.sample_anatomic_site.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.sample_anatomic_site);
      }
      if (tmp.sample_assay_method) {
        tmp.sample_assay_method.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.sample_assay_method);
      }
      if (tmp.sample_composition_type) {
        tmp.sample_composition_type.sort((a, b) => {
          const l_a = a.k.toLowerCase();
          const l_b = b.k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
        loadHelper.reOrderDataElment(tmp.sample_composition_type);
      }
      if (tmp.projects) {
        tmp.projects.sort((a, b) => {
          const l_a = a.p_k.toLowerCase();
          const l_b = b.p_k.toLowerCase();
          return l_a < l_b ? -1 : 1;
        });
      }
      //re-order additional data element to be lower case alphabetic order
      if (tmp.additional) {
        tmp.additional.forEach((add) => {
          if (["Grant ID", "Grant Name"].indexOf(add.attr_name) === -1 ) {
            add.attr_set.sort((a, b) => {
              const l_a = a.k.toLowerCase();
              const l_b = b.k.toLowerCase();
              return l_a < l_b ? -1 : 1;
            });
          }
        });
      }
      //indexing dataset into elasticsearch
      let result = await elasticsearch.addDocument(config.indexDS.alias, tmp.data_resource_id + "_" + tmp.dataset_id , tmp);
      dsDocuments.push(tmp);
      logger.info("Indexed document into elasticsearch: " + result._id);
    }
    //indexing dataresource into elasticsearch
    let drDocument = {};
    drDocument.data_resource_id = drs[i].id;
    drDocument.resource_name = drs[i].resource_name;
    drDocument.resource_type = drs[i].resource_type;
    drDocument.description = drs[i].description;
    drDocument.resource_uri = drs[i].resource_uri;
    let data_content_type_str = drs[i].data_content_type.toLowerCase();
    let data_content_type = [];
    if(data_content_type_str.indexOf("genomics") > -1) {
      data_content_type.push("Genomics/Omics");
    }
    if(data_content_type_str.indexOf("imaging") > -1) {
      data_content_type.push("Imaging");
    }
    if(data_content_type_str.indexOf("clinical") > -1) {
      data_content_type.push("Clinical");
    }
    if(data_content_type_str.indexOf("xenograft") > -1) {
      data_content_type.push("Xenograft");
    }
    if(data_content_type_str.indexOf("cell") > -1) {
      data_content_type.push("Cell Lines");
    }
    if(data_content_type_str.indexOf("epidemiologic") > -1) {
      data_content_type.push("Epidemiologic");
    }
    if(data_content_type_str.indexOf("biospecimens") > -1) {
      data_content_type.push("Biospecimens");
    }
    drDocument.data_content_type = data_content_type.length === 0 ? "" : data_content_type.join(",");
    drDocument.poc = drs[i].poc;
    drDocument.poc_email = drs[i].poc_email;
    drDocument.api = drs[i].api;
    drDocument.pediatric_specific = drs[i].pediatric_specific;
    drDocument.analytics = drs[i].analytics;
    drDocument.visualization = drs[i].visualization;
    drDocument.datasets_total = datasets.length;
    if (drs[i].data_update_date == null){
      drDocument.data_update_date = drs[i].initial_submission_date;
    } else {
      drDocument.data_update_date = Math.max(drs[i].initial_submission_date, drs[i].data_update_date);
    }
    drDocument.data_update_date = utils.timestampToString(drDocument.data_update_date);
    let result = await elasticsearch.addDocument(config.indexDR.alias, drDocument.data_resource_id , drDocument);
    drDocuments.push(drDocument);
    logger.info("Indexed document into elasticsearch: " + result._id);
  }
  logger.info("Start aggragating data to generate filter list.");
  await loadHelper.deletePreviousAggratedData();
  const aggratedData = await loadHelper.insertAggratedData(submissionIDs);
  let rowCount = await loadHelper.insertAggratedDataForDataResource(submissionIDs);
  rowCount += await loadHelper.insertAggratedDataForDataResourceTypeFilter();
  rowCount += await loadHelper.insertAggratedDataForDataContentTypeFilter();
  rowCount += await loadHelper.insertAggratedDataForSiteUpdateDate();
  logger.info("End of aggragating data: " + ( aggratedData + rowCount ) + " records have been created.");
  logger.info("Start creating CCDC website documents.");
  const ccdcDocuments = [];
  const homePageDocument = loadHelper.getHomePageDocument();
  ccdcDocuments.push(homePageDocument);
  const aboutPageDocument = loadHelper.getAboutPageDocument();
  ccdcDocuments.push(aboutPageDocument);
  const glossaries = await loadHelper.getGlossary();
  const glossaryPageDocument = loadHelper.getGlossaryPageDocument(glossaries);
  ccdcDocuments.push(glossaryPageDocument);
  const siteUpdatesDocument = await loadHelper.getSiteUpdatesDocument();
  ccdcDocuments.push(siteUpdatesDocument);
  /*
  const datasetDocuments = loadHelper.getDatasetDocuments(dsDocuments);
  datasetDocuments.forEach((dd) => {
    ccdcDocuments.push(dd);
  });
  const dataResourceDocuments = loadHelper.getDataResourceDocuments(drDocuments);
  dataResourceDocuments.forEach((drd) => {
    ccdcDocuments.push(drd);
  });
  */
  for(let c = 0; c< ccdcDocuments.length; c++){
    let tmp = await elasticsearch.addDocument(config.indexDoc.alias, ccdcDocuments[c].uid , ccdcDocuments[c]);
    logger.info("Indexed document into elasticsearch: " + tmp._id);
  }
  
  logger.info("End of creating website documents : " + ccdcDocuments.length + " records have been created.");
};

module.exports = load;