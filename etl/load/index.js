const config = require("../../config");
const logger = require("../../common/logger");
const loadHelper = require("./loadHelper");
const { toNumber } = require("lodash");
const elasticsearch = require("../../common/elasticsearch");
const utils = require("../../common/utils");
const {
  readNCItSynonyms,
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
  const synonyms = readNCItSynonyms();
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
      if(has_partition && tmp.primary_dataset_scope.toLowerCase() == "program"){
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
          const syn = synonyms[disease.k.trim().toLowerCase()];
          if(syn) {
            disease.s = syn;
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
    let data_content_type = [];
    if(drs[i].has_genomics_omics === 1) {
      data_content_type.push("Genomics & Omics");
    }
    if(drs[i].has_imaging_data === 1) {
      data_content_type.push("Imaging");
    }
    if(drs[i].has_clinical_data === 1) {
      data_content_type.push("Clinical");
    }
    if(drs[i].has_xenograft_data === 1) {
      data_content_type.push("Xenograft");
    }
    if(drs[i].has_cell_lines_data === 1) {
      data_content_type.push("Cell Lines");
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