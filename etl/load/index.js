const config = require("../../config");
const logger = require("../../common/logger");
const loadHelper = require("./loadHelper");
const { toNumber } = require("lodash");
const elasticsearch = require("../../common/elasticsearch");

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
  //get data resource list from table data_resources
  const drs = await loadHelper.getDataResources();
  //iterator on data resource
  for(let i = 0; i< drs.length; i++){
    logger.info("Start transforming and loading data into elasticsearch for data resource: " + drs[i].id);
    //pick the most up-to-date submission to process
    const submission = await loadHelper.getSubmissionUpToDate(drs[i].id);
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
      tmp.data_resource_id = drs[i].id;
      tmp.dataset_id = dataset.id;
      tmp.dataset_name = dataset.dataset_name;
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
      //indexing dataset into elasticsearch
      let result = await elasticsearch.addDocument(config.indexDS.alias, tmp.data_resource_id + "_" + tmp.dataset_id , tmp);
      logger.info("Indexed document into elasticsearch: " + result._id);
    }
    //indexing dataresource into elasticsearch
    let dsDocument = {};
    dsDocument.data_resource_id = drs[i].id;
    dsDocument.resource_name = drs[i].resource_name;
    dsDocument.resource_type = drs[i].resource_type;
    dsDocument.description = drs[i].description;
    dsDocument.resource_uri = drs[i].resource_uri;
    dsDocument.has_genomics_omics = drs[i].has_genomics_omics;
    dsDocument.has_imaging_data = drs[i].has_imaging_data;
    dsDocument.has_clinical_data = drs[i].has_clinical_data;
    dsDocument.has_xenograft_data = drs[i].has_xenograft_data;
    dsDocument.has_cell_lines_data = drs[i].has_cell_lines_data;
    dsDocument.poc = drs[i].poc;
    dsDocument.poc_email = drs[i].poc_email;
    dsDocument.api = drs[i].api;
    dsDocument.pediatric_specific = drs[i].pediatric_specific;
    dsDocument.analytics = drs[i].analytics;
    dsDocument.visualization = drs[i].visualization;
    let result = await elasticsearch.addDocument(config.indexDR.alias, dsDocument.data_resource_id , dsDocument);
    logger.info("Indexed document into elasticsearch: " + result._id);
  }
};

module.exports = load;