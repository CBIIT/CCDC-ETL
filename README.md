# CCDC-ETL

## Introduction

This is CCDC's ETL, which loads data into MySQL and indexes that data in Elasticsearch.

## Prerequisites

- Digest files in `/digests`
- A remotely hosted `site_announcement_log.md` configured through `SITE_ANNOUNCEMENT_URL`
- Elasticsearch 7.17.10
- MySQL 8.0.34.0
- Node.js 16.18.0

## Set up repository

Clone this repository with the command

```bash
git clone https://github.com/CBIIT/CCDC-ETL.git
```

## Install Node.js packages

Run `yarn install` or `npm install`, depending on which package manager you use.

## Environment variables

Create a `.env` file by making a copy of `.env.example`. Change the values of the environment variables in `.env` as appropriate.

`SITE_ANNOUNCEMENT_URL` must be a complete HTTPS URL for the Markdown release-notes file. Each deployed layer should provide its own value through its environment configuration. For example, development can use:

```text
SITE_ANNOUNCEMENT_URL=https://raw.githubusercontent.com/CBIIT/CCDC_Static_Contents/dev/site_announcement_log.md
```

QA and production should point to their corresponding static-content branches or deployment URLs. An environment variable supplied by the deployment takes precedence over the local `.env` value.

The ETL fetches and validates this file once per run, then transactionally replaces the MySQL `changelog` rows. The existing WebService release-note endpoints and the database-backed global-search document continue to use those rows.

This repository does not contain deployment manifests for dev, QA, or production. Deployment configuration owners must add `SITE_ANNOUNCEMENT_URL` to each layer's secret or configuration mechanism.

## Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

## Run ETL

Ensure that Elasticsearch and MySQL are running, and then run the command

```bash
node index.js
```
