const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const csv = require('csv-parser');

const results = [];

// Leer y procesar el archivo CSV
fs.createReadStream(workerData.filePath)
  .pipe(csv())
  .on('data', (data) => {
    // Solo agregar datos si 'value' es diferente de 0
    const value = parseFloat(data['value']);
    
    // Verifica si hay una clase especificada y si el archivo incluye la clase
    const includeClass = !workerData.clase || workerData.filePath.includes(workerData.clase);
    
    if (value !== 0 && includeClass) {
      results.push(data);
    }
  })
  .on('end', () => {
    // Enviar los resultados de vuelta al thread principal
    parentPort.postMessage(results);
  })
  .on('error', (error) => {
    // Manejo de errores: enviar el mensaje de error al thread principal
    parentPort.postMessage({ error: error.message });
  });
