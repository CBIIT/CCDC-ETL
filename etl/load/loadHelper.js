const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
const utils = require("../../common/utils");

let loadHelper = {};

loadHelper.getDataResources = async () => {
  let sql = "select * from data_resources";
  
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getSubmissionUpToDate = async (dataResourceId) => {
  let sql = "select * from submissions where resource_id = ? order by id desc";

  let inserts = [
    dataResourceId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getDatasets = async (submissionId) => {
  let sql = "select * from datasets where submission_id = ?";

  let inserts = [
    submissionId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getDigest = async (datasetId) => {
  let sql = "select * from digests where dataset_id = ?";

  let inserts = [
    datasetId
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.getGlossary = async () => {
  let sql = "select * from glossary";

  let inserts = [
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.reOrderDataElment = (dataObj) => {
  let idx_1 = -1, idx_2 = -1;
  dataObj.forEach((cdd, idx) => {
    if (cdd.k === "Not Reported") {
      idx_1 = idx;
    }
  });
  let obj_1;
  if (idx_1 > -1) {
    obj_1 = dataObj[idx_1];
    dataObj.splice(idx_1, 1);
    dataObj.push(obj_1);
  }
  let obj_2;
  dataObj.forEach((cdd, idx) => {
    if (cdd.k === "Unknown") {
      idx_2 = idx;
    }
  });
  if (idx_2 > -1) {
    obj_2 = dataObj[idx_2];
    dataObj.splice(idx_2, 1);
    dataObj.push(obj_2);
  }
};

loadHelper.deletePreviousAggratedData = async () => {
  let sql = "delete from aggragation";
  
  try{
      const result = await mysql.query(sql);
      return result;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedData = async (submissionIDs) => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        +"select data_element, element_value, sum(1) from digests where core_element=1 and dataset_id in (select ds.id from datasets ds where ds.submission_id in ("
        +submissionIDs.join()+")) group by data_element, element_value";
    
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedDataForDataResource = async (submissionIDs) => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        +"select 'Resource', sub.resource_id, sum(1) from submissions sub, datasets ds where ds.submission_id = sub.id and sub.id in ("
        +submissionIDs.join()+") group by sub.resource_id";
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedDataForDataResourceTypeFilter = async () => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        + "select dr.resource_type, dr.id, COALESCE(sum(1), 0) from data_resources dr group by dr.id UNION ALL "
        + "select 'Resource Type', dr.resource_type, COALESCE(sum(1), 0) from data_resources dr group by dr.resource_type";
        
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedDataForDataContentTypeFilter = async () => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        + "select 'Data Content Type', 'Genomics/Omics', COALESCE(sum(1), 0) from data_resources dr where dr.has_genomics_omics = 1 UNION ALL "
        + "select 'Data Content Type', 'Imaging', COALESCE(sum(1), 0) from data_resources dr where dr.has_imaging_data = 1 UNION ALL "
        + "select 'Data Content Type', 'Clinical', COALESCE(sum(1), 0) from data_resources dr where dr.has_clinical_data = 1 UNION ALL "
        + "select 'Data Content Type', 'Xenograft', COALESCE(sum(1), 0) from data_resources dr where dr.has_xenograft_data = 1 UNION ALL "
        + "select 'Data Content Type', 'Cell Lines', COALESCE(sum(1), 0) from data_resources dr where dr.has_cell_lines_data = 1 ";
  let inserts = [];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};

loadHelper.insertAggratedDataForSiteUpdateDate = async () => {
  let sql = "insert into aggragation (data_element, element_value, dataset_count) "
        + "values('Site Data Update', ?, 0)";
  let inserts = [
    utils.getTodayDate()
  ];
  sql = mysql.format(sql, inserts);
  try{
      const result = await mysql.query(sql);
      return result.affectedRows;
  }
  catch(error){
      logger.error(error);
      return -1;
  }
};



loadHelper.getHomePageDocument = () => {
  const contents = [];
  contents.push("<p> Childhood Cancer Data Catalog: A searchable database of pediatric data resources; Sharing clinical care and research data generated by the pediatric cancer research community. </p>");
  contents.push("<p> Childhood Cancer Data Catalog: A searchable database of pediatric data resources; Sharing clinical care and research data generated by the pediatric cancer research community. </p>");
  contents.push("<p> The CCDI Childhood Cancer Data Catalog is a searchable database of National Cancer Institute and other pediatric cancer resources. </p>");
  contents.push("<p> Resources include repositories, registries, programs, knowledgebases, analytic tools and catalogs that either manage or refer to data. Users can browse and filter the list of data resources or enter search terms to identify data of interest. </p>");
  return {
    uid: "home",
    title: "CCDI Data Catalog",
    description: "The CCDI Childhood Cancer Data Catalog is a searchable database of National Cancer Institute and other pediatric cancer resources.",
    content: contents.join(),
    link: "/"
  };
};

loadHelper.getAboutPageDocument = () => {
  const contents = [];
  contents.push("<p> The Childhood Cancer Data Catalog is part of NCI’s Childhood Cancer Data Initiative (CCDI) , which is building a community centered around childhood cancer care and research data. Through enhanced data sharing, we can improve understanding of cancer biology, preventive measures, treatment, quality of life, and survivorship, as well as ensure that researchers learn from every child with cancer. Sign-up for email updates from NCI about CCDI. </p>");
  contents.push("<p> The CCDI Childhood Cancer Data Catalog is an inventory of pediatric oncology data resources, including childhood cancer repositories, registries, programs, knowledgebases, analytic tools and catalogs that either manage or refer to data. The data catalog is intended to help researchers learn about existing pediatric data resources to develop new biomedical hypothesis or analyze the data for clinical or therapeutic efficacy. While the data catalog does not provide access to the data, it provides summary information that will allow researchers to select the resource(s) relevant to their work. </p>");
  contents.push("<p> Each data resource summary includes an overview by disease type, number of samples taken and analyzed, availability of molecular and imaging data, and characteristics of the samples studied (e.g., age, phenotype). After reviewing the data resource summaries, researchers can use the provided link or contact details to learn how to gain access to the data. </p>");
  contents.push("<p> NCI is interested in expanding this resource. Submit summaries about your data resource makes the existence known to a broader community and helps to promote the use of the data. </p>");
  contents.push("<p> If you would like to include your resource in this data catalog, complete the summary submission template and send it to Childhood Cancer Data Initiative . Summaries quantify one or more data element values such as count, minimum, maximum, or average. A data element is a unit of data such as a disease diagnosis, or case age. Each assertion in a summary pertains to a data element and its value or set of values in a dataset. </p>");
  return {
    uid: "about",
    title: "About CCDC",
    description: "The Childhood Cancer Data Catalog is part of NCI’s Childhood Cancer Data Initiative (CCDI) , which is building a community centered around childhood cancer care and research data. Through enhanced data sharing, we can improve understanding of cancer biology, preventive measures, treatment, quality of life, and survivorship, as well as ensure that researchers learn from every child with cancer. Sign-up for email updates from NCI about CCDI.",
    content: contents.join(),
    link: "/about"
  };
};

loadHelper.getGlossaryPageDocument = (glossaries) => {
  const contents = [];
  glossaries.forEach((g) => {
    contents.push(" " + g.term_category + " " + g.term_name + " " + g.definition + " " + g.reference + " ");
  });
  return {
    uid: "glossary",
    title: "CCDC Glossary",
    description: "Describe CCDC Terms, definition and source of the definition.",
    content: contents.join(),
    link: "/glossary"
  };
};

loadHelper.getDatasetDocuments = (datasets) => {
  let dataElements = ["case_disease_diagnosis", "case_age_at_diagnosis",
    "case_ethnicity", "case_race", "case_sex", "case_tumor_site",
      "case_treatment_administered", "case_treatment_outcome", "sample_assay_method"];
  const results = datasets.map((ds) => {
    const contents = [];
    contents.push("<p> "+ ds.poc +" </p>");
    contents.push("<p> "+ ds.poc_email +" </p>");
    contents.push("<p> "+ ds.primary_dataset_scope +" </p>");
    let tmp = ds;
    dataElements.forEach((de) => {
      if(tmp[de]) {
        tmp[de] = tmp[de].map((t) => {
          contents.push("<p> "+ t.n + " " + t.v +" </p>");
        });
      }
    });
    if(tmp.additional) {
      tmp.additional = tmp.additional.map((t) => {
        let sets = [];
        t.attr_set.forEach((as) => {
          sets.push(as.k);
        });
        contents.push("<p> "+ t.attr_name + " " + sets.join(" ") + " </p>");
      });
    }
    return {
      uid: "ds_" + ds.dataset_id,
      title: ds.dataset_name,
      description: ds.desc,
      content: contents.join(),
      link: "/dataset/"+ ds.dataset_id
    };
  });
  return results;
};

loadHelper.getDataResourceDocuments = (dataResources) => {
  const results = dataResources.map((dr) => {
    const contents = [];
    contents.push("<p> "+ dr.analytics +" </p>");
    contents.push("<p> "+ dr.api +" </p>");
    contents.push("<p> "+ dr.data_content_type +" </p>");
    contents.push("<p> "+ dr.poc +" </p>");
    contents.push("<p> "+ dr.poc_email +" </p>");
    contents.push("<p> "+ dr.resource_uri +" </p>");
    return {
      uid: "dr_" + dr.data_resource_id,
      title: dr.resource_name,
      description: dr.description,
      content: contents.join(),
      link: "/resource/"+ dr.data_resource_id
    };
  });
  return results;
};

module.exports = loadHelper;