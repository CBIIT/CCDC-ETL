var indices = {};

indices.datasetsIndexConfig = {
  settings: {
    "number_of_shards": 1,
    "max_result_window": 5000,
    "max_inner_result_window": 500,
    "mapping.total_fields.limit": 2000,
    "max_ngram_diff": "30",
    "analysis": {
      "filter":{
        "my_filter":{
          "type":"ngram",
          "min_gram":3,
          "max_gram":30,
          "token_chars":[
            "letter",
            "digit",
            "symbol",
            "punctuation"
          ]
        }
      },
      "analyzer":{
        "keyword_analyzer":{
          "type":"custom",
          "tokenizer":"keyword",
          "filter":[
            "lowercase"
          ]
        },
        "standard_analyzer": {
          "type":"custom",
          "tokenizer": "whitespace",
          "filter": [
            "lowercase",
            "my_filter"
          ]
        }
      }
    }
  },
  mappings: {
    properties: {
        "data_resource_id": {
          "type": "keyword",
        },
        "data_resource_name": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "dataset_id": {
          "type": "keyword",
        },
        "dataset_name": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "desc": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "primary_dataset_scope": {
          "type": "keyword"
        },
        "poc": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "poc_email": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "published_in": {
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "digest_type": {
          "type": "keyword"
        },
        "digest_date": {
          "type": "date"
        },
        "case_age": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_age_at_diagnosis": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_age_at_trial": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_disease_diagnosis": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            },
            "s":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            }
          }
        },
        "case_ethnicity": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_gender": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_proband": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_race": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_sex": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_sex_at_birth": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_treatment_administered": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_treatment_outcome": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "case_tumor_site": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "donor_age": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "donor_disease_diagnosis": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "donor_sex": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "program_name":{
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "project_anatomic_site": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "project_cancer_studied": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "project_name":{
          "type": "text",
          "analyzer": "standard_analyzer",
          "search_analyzer": "keyword_analyzer"
        },
        "sample_analyte_type": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_anatomic_site": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_assay_method": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_composition_type": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_repository_name": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_is_normal": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "sample_is_xenograft": {
          "type": "nested",
          "properties":{
            "k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "v":{
              "type": "integer"
            }
          }
        },
        "projects": {
          "type": "nested",
          "properties":{
            "p_k":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "p_v":{
              "type": "nested",
              "properties":{
                "k":{
                  "type": "text",
                  "analyzer": "standard_analyzer",
                  "search_analyzer": "keyword_analyzer"
                },
                "v":{
                  "type": "integer"
                }
              }
            }
          }
        },
        "program_id": {
          "type": "integer"
        },
        "project_id": {
          "type": "integer"
        },
        "case_id": {
          "type": "integer"
        },
        "donor_id": {
          "type": "integer"
        },
        "cell_line_id": {
          "type": "integer"
        },
        "sample_id": {
          "type": "integer"
        },
        "additional":{
          "type": "nested",
          "properties":{
            "attr_name":{
              "type": "text",
              "analyzer": "standard_analyzer",
              "search_analyzer": "keyword_analyzer"
            },
            "attr_set":{
              "type": "nested",
              "properties":{
                "k":{
                  "type": "text",
                  "analyzer": "standard_analyzer",
                  "search_analyzer": "keyword_analyzer"
                },
                "v":{
                  "type": "integer",
                }
              }
            }
          }
        }
    }
  }
};

indices.dataresourcesIndexConfig = {
  settings: {
    number_of_shards: 1,
    max_result_window: 1000,
    max_inner_result_window: 50,
    analysis: {
      analyzer: {
        standard_analyzer: {
          filter: ["lowercase"],
          tokenizer: "standard"
        }
      }
    }
  },
  mappings: {
    properties: {
      "data_resource_id": {
        "type": "keyword"
      },
      "resource_name": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "resource_type": {
        "type": "keyword"
      },
      "description":{
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "resource_uri": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "data_content_type": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "poc": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "poc_email": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "api": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "pediatric_specific": {
        "type": "text",
        "analyzer": "standard_analyzer"
      },
      "analytics": {
        "type": "keyword"
      },
      "visualization": {
        "type": "keyword"
      },
      "datasets_total": {
        "type": "integer"
      }
    }
  }
};

indices.documentsIndexConfig = {
  settings: {
    number_of_shards: 1,
    max_result_window: 5000,
    max_inner_result_window: 500,
    "max_ngram_diff": "30",
    "analysis": {
      "filter":{
        "document_filter":{
          "type":"ngram",
          "min_gram":3,
          "max_gram":30,
          "token_chars":[
            "letter",
            "digit",
            "symbol",
            "punctuation"
          ]
        }
      },
      "analyzer":{
        "keyword_analyzer":{
          "type":"custom",
          "tokenizer":"keyword",
          "filter":[
            "lowercase"
          ]
        },
        "standard_analyzer": {
          "type":"custom",
          "tokenizer": "whitespace",
          "filter": [
            "lowercase",
            "document_filter"
          ]
        }
      }
    }
  },
  mappings: {
    properties: {
      "title": {
        "type": "text",
        "analyzer": "standard_analyzer",
        "search_analyzer": "keyword_analyzer"
      },
      "description": {
        "type": "text",
        "analyzer": "standard_analyzer",
        "search_analyzer": "keyword_analyzer"
      },
      "link": {
        "type": "keyword"
      },
      "content": {
        "type": "text",
        "analyzer": "standard_analyzer",
        "search_analyzer": "keyword_analyzer"
      }
    }
  }
};

module.exports = indices;
