# CCDC-ETL

## Introduction
This is the ETL part of the CCDC project, it will mainly responsible for loading the data into relational database and further index into Elasticsearch for querting purpose.

## Configuration
- add .env file or change the configuration in config folder.
- config data folder & Mysql connection & Elasticsearch connection

## Install dependencies

```bash
$ npm install
```
or 

```bash
$ yarn install
```

## Run ETL
```bash
node index.js
```