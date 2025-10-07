const { stripHtml } = require('string-strip-html');
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
  let sql = "select * from data_resources";
  let dataContentType = {
    "Genomics/Omics": 0,
    "Imaging": 0,
    "Clinical": 0,
    "Xenograft": 0,
    "Cell Lines": 0,
    "Epidemiologic": 0,
    "Biospecimens": 0
  };
  try{
      const drs = await mysql.query(sql);
      for(let i = 0; i< drs.length; i++){
        let dct = drs[i].data_content_type.toLowerCase();
        if(dct.indexOf("genomics") > -1) {
          dataContentType["Genomics/Omics"] ++;
        }
        if(dct.indexOf("imaging") > -1) {
          dataContentType["Imaging"] ++;
        }
        if(dct.indexOf("clinical") > -1) {
          dataContentType["Clinical"] ++;
        }
        if(dct.indexOf("xenograft") > -1) {
          dataContentType["Xenograft"] ++;
        }
        if(dct.indexOf("cell") > -1) {
          dataContentType["Cell Lines"] ++;
        }
        if(dct.indexOf("epidemiologic") > -1) {
          dataContentType["Epidemiologic"] ++;
        }
        if(dct.indexOf("biospecimens") > -1) {
          dataContentType["Biospecimens"] ++;
        }
      }
  }
  catch(error){
      logger.error(error);
      return -1;
  }

  sql = "insert into aggragation (data_element, element_value, dataset_count) values ";
  for(const [key, value] of Object.entries(dataContentType)){
    sql += "('Data Content Type','" + key +"', " + value + "),";
  }
  sql = sql.substring(0, sql.length - 1);
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
  contents.push("<p> Childhood Cancer Data Initiative </p>");
  contents.push("<p> The NCI’s Childhood Cancer Data Initiative (CCDI) , which the Childhood Cancer Data Catalog is part of, is an initiative seeking to build a community centered around childhood cancer care and research. Through enhanced data sharing, the initiative works to improve understanding of cancer biology, preventive measures, treatment, quality of life, and survivorship, as well as ensure that the community can learn from every child with cancer. </p>");
  contents.push("<p> The Childhood Cancer Data Catalog is part of the CCDI Data Ecosystem. Learn more about other CCDI data and resources on the  CCDI Hub , and  sign up for email updates about CCDI. </p>");
  contents.push("<p> CCDI Data Catalog </p>");
  contents.push("<p> The Childhood Cancer Data Catalog (CCDC) is an inventory of pediatric oncology data resources, including childhood cancer repositories, registries, programs, knowledgebases, analytic tools and catalogs that either manage or refer to data. The data catalog is intended to help researchers, clinicians, and citizen scientists learn about existing pediatric data resources to develop new biomedical hypotheses, analyze the data for clinical or therapeutic efficacy, and foster connections within the community to existing pediatric oncology research sites. </p>");
  contents.push("<p> Each CCDC participating resource includes information on one or more datasets for review. Summaries of these datasets include an overview by disease type, information on number of participants and samples, availability of molecular and imaging data, and characteristics of the population included and samples gathered (e.g., age, phenotype). The information found for each dataset is unique, and datasets, even within a single participating resource, may contain varying amounts of available data. After reviewing the dataset summaries, resource links and contact details can be used to connect with resource owners to learn more about how to gain access to the data. The data catalog does not provide access to a resource’s data. </p>");
  contents.push("<p> Please note, the data on the CCDC site is only updated periodically and data on the site may not be as current as would be found on a resource's own data sharing site. For the most up to date information about a dataset, it is recommended to work directly with a resource owner. The resources owners, not the CCDC, would be in a place to provide in-depth information about a dataset. More information about the point of contact for each resource can be found on the Participating Resources page. </p>");
  contents.push("<p> Contribute to the CCDI Data Catalog </p>");
  contents.push("<p> The NCI is interested in expanding resources available in the data catalog. Data resource owners are invited to submit summaries about their data resource(s) to the CCDC to make it known to a broader community and help promote the use of the data. </p>");
  contents.push("<p> If you would like to include your resource in this data catalog, complete the summary submission template and send it to Childhood Cancer Data Initiative . Summaries quantify one or more data element values such as count, minimum, maximum, or average. A data element is a unit of data such as a disease diagnosis, or case age. Each assertion in a summary pertains to a data element and its value or set of values in a dataset. </p>");
  contents.push("<p> For questions, please send email to Childhood Cancer Data Initiative. </p>");
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

loadHelper.getSiteUpdatesDocument = async () => {
  const contents = [];
  let sql = "SELECT post_date, title, description, details FROM changelog WHERE log_type=1";
  let inserts = [];

  sql = mysql.format(sql, inserts);

  try {
    const results = await mysql.query(sql);
    results.forEach((siteUpdate) => {
      [
        siteUpdate.post_date.toLocaleString('default', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        siteUpdate.title,
        stripHtml(siteUpdate.description).result,
        stripHtml(siteUpdate.details).result,
      ].forEach((text) => {
        const trimmedText = text.trim();

        if (trimmedText) {
          contents.push(`<p> ${trimmedText} </p>`);
        }
      });
    });
    // console.log(contents);
    return {
      uid: "siteupdate",
      title: "CCDI Site Updates",
      description: "A chronological listing of site updates and changes.",
      content: contents.join(),
      link: "/releasenotes"
    };
  } catch (error) {
    logger.error(error);
    return -1;
  }
  // return {
  //   uid: "siteupdate",
  //   title: "Updates to the Data Catalog Site",
  //   description: "A page that lists updates to this site.",
  //   content: contents.join(),
  //   link: "/siteupdate"
  // };
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