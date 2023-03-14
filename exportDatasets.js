const etl = require("./etl");

const exportDatasets = async function(){
    await etl.exportDatasets();
    etl.finishedExportDatasets();
};

exportDatasets();