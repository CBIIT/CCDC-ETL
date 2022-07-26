const logger = require("../../common/logger");
const mysql = require("../../common/mysql");
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
    ws.column(1).setWidth(30);
    ws.column(2).setWidth(60);
    ws.column(3).setWidth(30);
    ws.column(4).setWidth(30);
    ws.column(5).setWidth(35);
    ws.cell(1, 1).string('ID').style(style);
    ws.cell(1, 2).string('Resource Name').style(style);
    ws.cell(1, 3).string('Initial Submission Date').style(style);
    ws.cell(1, 4).string('Data Update Date').style(style);
    ws.cell(1, 5).string('Suggested Next Data Update').style(style);
    dataJson.forEach((dj, idx) => {
        ws.cell(idx + 2, 1).string(dj.id);
        ws.cell(idx + 2, 2).string(dj.resource_name);
        if (dj.initial_submission_date === null) {
            ws.cell(idx + 2, 3).string("");
        } else {
            ws.cell(idx + 2, 3).date(dj.initial_submission_date).style({numberFormat: 'mm/dd/yyyy'});
        }
        if (dj.data_update_date === null) {
            ws.cell(idx + 2, 4).string("");
        } else {
            ws.cell(idx + 2, 4).date(dj.data_update_date).style({numberFormat: 'mm/dd/yyyy'});
        }
        if (dj.suggested_next_data_update === null) {
            ws.cell(idx + 2, 5).string("");
        } else {
            ws.cell(idx + 2, 5).date(dj.suggested_next_data_update).style({numberFormat: 'mm/dd/yyyy'});
        }
    });

    wb.write(util.getTodayDateFormatted() + '_Resource Update Report.xlsx');
};

var reporting = {};

reporting.run = async () => {
    logger.info("Start reporting...");
    let sql = "select id, resource_name, initial_submission_date, data_update_date, suggested_next_data_update from data_resources order by suggested_next_data_update";
    let inserts = [];
    sql = mysql.format(sql, inserts);
    try{
        const result = await mysql.query(sql);
        createXLSX(result);
        logger.info(`Successfully added ${result.length} data resource entries to the report.`);
    }
    catch(error){
        logger.error(error);
    }
    logger.info("End of reporting.");
};

module.exports = reporting;