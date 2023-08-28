# CCDC-ETL

## Introduction

This is CCDC's ETL, which loads data into MySQL and indexes that data in Elasticsearch.

## Prerequisites

- Digest files in `/digests`
- `site_announcements.xlsx` file in `/digests`
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
