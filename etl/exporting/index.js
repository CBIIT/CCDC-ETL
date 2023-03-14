const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
const elasticsearch = require("../../common/elasticsearch");
const config = require("../../config");
const util = require("../../common/utils");
const xl = require('excel4node');

const createXLSX = (dataJson) => {
    let wb = new xl.Workbook();
    let ws = wb.addWorksheet('Report');
    let style = wb.createStyle({
        font: {
            color: "#ffffff",
            size: 16,
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            bgColor: "#6e6e6e",
            fgColor: "#6e6e6e",
        },
        dateFormat: 'mm/dd/yy',
    });
    const fields = [
        {
          label: 'Resource',
          value: 'data_resource_id'
        },
        {
          label: 'Dataset ID',
          value: 'dataset_id'
        },
        {
          label: 'Dataset',
          value: 'dataset_name'
        },
        {
          label: 'Description',
          value: 'desc'
        },
        {
          label: 'Primary Dataset Scope',
          value: 'primary_dataset_scope'
        },
        {
          label: 'Point of Contact',
          value: 'poc'
        },
        {
          label: 'Point of Contact Email',
          value: 'poc_email'
        },
        {
          label: 'Published In',
          value: 'published_in'
        },
        {
          label: "Number of Cases",
          value: "case_id"
        },
        {
          label: "Number of Samples",
          value: "sample_id"
        },
        {
          label: "Case Disease Diagnosis",
          value: "case_disease_diagnosis"
        },
        {
          label: "Case Age at Diagnosis",
          value: "case_age_at_diagnosis"
        },
        {
          label: "Case Ethnicity",
          value: "case_ethnicity"
        },
        {
          label: "Case Race",
          value: "case_race"
        },
        {
          label: "Case Sex",
          value: "case_sex"
        },
        {
          label: "Case Gender",
          value: "case_gender"
        },
        {
          label: "Case Tumor Site",
          value: "case_tumor_site"
        },
        {
          label: "Case Treatment Administered",
          value: "case_treatment_administered"
        },
        {
          label: "Case Treatment Outcome",
          value: "case_treatment_outcome"
        },
        {
          label: "Sample Assay Method",
          value: "sample_assay_method"
        },
        {
          label: "Sample Analyte Type",
          value: "sample_analyte_type"
        },
        {
          label: "Sample Anatomic Site",
          value: "sample_anatomic_site"
        },
        {
          label: "Sample Composition Type",
          value: "sample_composition_type"
        },
        {
          label: "Sample is Normal",
          value: "sample_is_normal"
        },
        {
          label: "Sample is Xenograft",
          value: "sample_is_xenograft"
        },
        {
          label: "dbGaP ID",
          value: "dbgap_id"
        },
        {
          label: "Grant",
          value: "grant"
        },
        {
          label: "Grant Info",
          value: "grant_info"
        },
    ];
    fields.forEach((field, idx) => {
        ws.column(idx+1).setWidth(30);
        ws.cell(1, idx+1).string(field.label).style(style);
    });
    dataJson.forEach((dj, idx) => {
        fields.forEach((field, fIdx) => {
            let value = "";
            if (dj[field.value] === undefined || dj[field.value] === null) {
                ws.cell(idx + 2, fIdx + 1).string("");
            } else if (typeof dj[field.value] === "number") {
                ws.cell(idx + 2, fIdx + 1).number(dj[field.value]);
            } else if (dj[field.value].constructor.toString().indexOf("Array") > -1) {
                ws.cell(idx + 2, fIdx + 1).string(dj[field.value].join(";"));
            } else {
                ws.cell(idx + 2, fIdx + 1).string(dj[field.value]);
            }
        });
    });

    wb.write('CCDC_Datasets_'+ util.getTodayDateFormatted() +'.xlsx');
};

var exporting = {};

exporting.run = async () => {
    logger.info("Start exporting...");
    let searchText = "";
    let filters = [];
    let pageInfo = {page: 1, pageSize: 5000};
    let sort = {name: "Resource", k: "data_resource_id", v: "asc"};
    let options = {};
    options.pageInfo = pageInfo;
    options.sort = sort;
    try{
        const result = await export2CSV(searchText, filters, options);
        createXLSX(result);
        logger.info(`Successfully exported ${result.length} CCDC datasets to Excel.`);
    }
    catch(error){
        logger.error(error);
    }
    logger.info("End of exporting.");
};

const getSearchQuery = (searchText, filters, options) => {
    let body = {
        size: options.pageInfo.pageSize,
        from: (options.pageInfo.page - 1 ) * options.pageInfo.pageSize
      };
    
      let compoundQuery = {};
      compoundQuery.bool = {};
      compoundQuery.bool.must = [];
    
      const strArr = searchText.trim().split(" ");
      const result = [];
      strArr.forEach((term) => {
        const t = term.trim();
        if (t.length > 2) {
          result.push(t);
        }
      });
      const keywords = result.length === 0 ? "" : result.join(" ");
      if(keywords != ""){
        const termArr = keywords.split(" ").map((t) => t.trim());
        const uniqueTermArr = termArr.filter((t, idx) => {
          return termArr.indexOf(t) === idx;
        });
        uniqueTermArr.forEach((term) => {
          let searchTerm = term.trim();
          if(searchTerm != ""){
            let clause = {};
            clause.bool = {};
            clause.bool.should = [];
            let dsl = {};
            dsl.multi_match = {};
            dsl.multi_match.query = searchTerm;
            //dsl.multi_match.analyzer = "standard_analyzer";
            dsl.multi_match.fields = [
              "data_resource_name",
              "dataset_name",
              "desc",
              "primary_dataset_scope",
              "poc",
              "poc_email",
              "published_in",
              "program_name",
              "project_name"
            ];
            clause.bool.should.push(dsl);
            let nestedFields = [
            "case_age.k",
              "case_age_at_diagnosis.k",
              "case_age_at_trial.k",
              "case_disease_diagnosis.k",
              "case_disease_diagnosis.s",
              "case_ethnicity.k",
              "case_gender.k",
              "case_proband.k",
              "case_race.k",
              "case_sex.k",
              "case_sex_at_birth.k",
              "case_treatment_administered.k",
              "case_treatment_outcome.k",
              "case_tumor_site.k",
              "case_tumor_site.s",
              "donor_age.k",
              "donor_disease_diagnosis.k",
              "donor_sex.k",
              "project_anatomic_site.k",
              "project_cancer_studied.k",
              "sample_analyte_type.k",
              "sample_anatomic_site.k",
              "sample_assay_method.k",
              "sample_composition_type.k",
              "sample_repository_name.k",
              "sample_is_normal.k",
              "sample_is_xenograft.k"
            ];
            nestedFields.map((f) => {
              let idx = f.indexOf('.');
              let parent = f.substring(0, idx);
              dsl = {};
              dsl.nested = {};
              dsl.nested.path = parent;
              dsl.nested.query = {};
              dsl.nested.query.match = {};
              dsl.nested.query.match[f] = {"query":searchTerm};
              clause.bool.should.push(dsl);
            });
            let m = {};
            dsl = {};
            dsl.nested = {};
            dsl.nested.path = "projects";
            dsl.nested.query = {};
            dsl.nested.query.bool = {};
            dsl.nested.query.bool.should = [];
            m.match = {
              "projects.p_k": searchTerm
            };
            dsl.nested.query.bool.should.push(m);
            /*
            m = {};
            m.nested = {};
            m.nested.path = "projects.p_v";
            m.nested.query = {};
            m.nested.query.match = {};
            m.nested.query.match["projects.p_v.k"] = {"query":searchTerm};
            dsl.nested.query.bool.should.push(m);
            */
            clause.bool.should.push(dsl);
        
            dsl = {};
            dsl.nested = {};
            dsl.nested.path = "additional";
            dsl.nested.inner_hits = {};
            dsl.nested.inner_hits.name = searchTerm;
            dsl.nested.inner_hits.highlight = {
              pre_tags: ["<b>"],
              post_tags: ["</b>"],
              fields: {
                "additional.attr_set.k": {}
              }
            };
            dsl.nested.query = {};
            dsl.nested.query.bool = {};
            dsl.nested.query.bool.should = [];
            /*
            m = {};
            m.match = {
              "additional.attr_name": searchTerm
            };
            dsl.nested.query.bool.should.push(m);
            */
            m = {};
            m.nested = {};
            m.nested.path = "additional.attr_set";
            m.nested.query = {};
            m.nested.query.match = {};
            m.nested.query.match["additional.attr_set.k"] = {"query":searchTerm};
            dsl.nested.query.bool.should.push(m);
            clause.bool.should.push(dsl);
            compoundQuery.bool.must.push(clause);
          }
        });
        
      }
    
      if (filters.length > 0) {
        let clause = {};
        clause.bool = {};
        clause.bool.should = [];
        filters.forEach((filter) => {
          let dsl = {};
          dsl.term = {};
          dsl.term.data_resource_id = filter;
          clause.bool.should.push(dsl);
        });
        compoundQuery.bool.must.push(clause);
      }
    
      if (compoundQuery.bool.must.length > 0) {
        body.query = compoundQuery;
      }
      
      let agg = {};
      agg.myAgg = {};
      agg.myAgg.terms = {};
      agg.myAgg.terms.field = "data_resource_id";
      agg.myAgg.terms.size = 1000;
    
      body.aggs = agg;
      body.sort = [];
      let tmp = {};
      tmp[options.sort.k] = options.sort.v;
      body.sort.push(tmp);
      return body;
};

const export2CSV = async (searchText, filters, options) => {
    let query = getSearchQuery(searchText, filters, options);
    let searchResults = await elasticsearch.search(config.indexDS.alias, query);
    let dataElements = [
        "case_disease_diagnosis",
        "case_age_at_diagnosis",
        "case_ethnicity",
        "case_race",
        "case_sex",
        "case_gender",
        "case_tumor_site",
        "case_treatment_administered",
        "case_treatment_outcome",
        "sample_assay_method",
        "sample_analyte_type",
        "sample_anatomic_site",
        "sample_composition_type",
        "sample_is_normal",
        "sample_is_xenograft"
    ];
    let datasets = searchResults.map((ds) => {
      let tmp = ds._source;
      dataElements.forEach((de) => {
        if(tmp[de]) {
          tmp[de] = tmp[de].map((t) => {
            return t.n + " (" + t.v + ")";
          });
        }
      });
      if(tmp.additional) {
        tmp.grant = "";
        tmp.grant_ids = [];
        tmp.grant_names = [];
        tmp.dbgap_id = "";
        tmp.additional = tmp.additional.forEach((t) => {
          let attr = t.attr_name.toLowerCase();
          if (attr === "dbgap study identifier") {
            tmp.dbgap_id = t.attr_set.map((item) => {
                return item.k;
            }).join(";");
          } else if (attr === "grant") {
            tmp.grant = t.attr_set.map((item) => {
                return item.k;
            }).join(";");
          } else if (attr === "grant id") {
            tmp.grant_ids = t.attr_set.map((item) => {
                return item.k;
            });
          } else if (attr === "grant name") {
            tmp.grant_names = t.attr_set.map((item) => {
                return item.k;
            });
          }
        });
        tmp.grant_info = "";
        if (tmp.grant_ids.length > 0) {
            tmp.grant_info = tmp.grant_ids.map((item, idx) => {
                return item + "," + tmp.grant_names[idx];
            }).join(";");
        }
      }
      return ds._source;
    });
    return datasets;
  };

module.exports = exporting;