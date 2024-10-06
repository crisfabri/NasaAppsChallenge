const { workerData, parentPort } = require('worker_threads');
const fs = require('fs');
const readline = require('readline');

async function processCSV(filePath) {
    const results = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        // Divide la línea por comas y asigna los campos
        const [latitude, longitude, value] = line.split(',');

        // Estructura los datos en un objeto legible
        const dataObject = {
            value: parseFloat(value),
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
        };

        results.push(dataObject);

        // Envía los resultados en fragmentos de 100 filas
        if (results.length >= 100) {
            parentPort.postMessage(results);
            results.length = 0; // Vacía el array
        }
    }

    // Enviar los datos restantes
    if (results.length > 0) {
        parentPort.postMessage(results);
    }

    parentPort.close();
}

processCSV(workerData.filePath);
