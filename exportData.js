const etl = require("./etl");

const exportDatasets = async function(){
    await etl.exportDatasets();
    etl.finishedExportDatasets();
};

const exportResources = async function(){
    await etl.exportResources();
    etl.finishedExportResources();
};

exportDatasets();
exportResources();