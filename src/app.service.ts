import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';

@Injectable()
export class AppService {
  private csvDirectoryPath = 'data/APOLLO 18/Metano/csv';
  private csvDirectoryPath2 = 'data';
  private csvDirectoryPath3 = 'data/DataPerYear';
  private readdir = util.promisify(fs.readdir);

  async GetData(category: string, clase?: string): Promise<any[]> {
    const results: any[] = [];

    // Marcar tiempo de inicio
    const startTime = performance.now();

    // Filtrar archivos según la categoría y clase
    let csvFiles: string[];

    if (clase) {
      // Si se proporciona una clase, filtrar archivos por clase
      csvFiles = (await this.readdir(this.csvDirectoryPath)).filter(file => {
        return (category === 'post' && file.includes(clase) && file.includes('post')) ||
               (category === 'prior' && file.includes(clase) && file.includes('prior'));
      });
    } else {
      // Si no hay clase, solo buscar el archivo de total correspondiente
      csvFiles = (await this.readdir(this.csvDirectoryPath)).filter(file => {
        return (category === 'post' && file.includes('post_total')) ||
               (category === 'prior' && file.includes('prior_total'));
      });
    }

    if (!csvFiles.length) {
      throw new Error(`No CSV files found for category: ${category}` + (clase ? ` and class: ${clase}` : ''));
    }

    // Crear workers para procesar archivos CSV en paralelo
    const workerPromises = csvFiles.map(file => {
      return new Promise<any[]>((resolve, reject) => {
        const worker = new Worker(path.resolve('csvWorker.js'), {
          workerData: { filePath: path.join(this.csvDirectoryPath, file) }
        });

        worker.on('message', (data) => resolve(data));
        worker.on('error', (err) => reject(err));
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });

    // Esperar a que todos los workers terminen
    const workerResults = await Promise.all(workerPromises);

    // Combinar los resultados
    workerResults.forEach(result => results.push(...result));

    // Marcar tiempo de finalización
    const endTime = performance.now();

    console.log(`CSV Processing Time with Workers: ${(endTime - startTime).toFixed(2)} ms`);

    return results;
  }


  async GetData2(csvFile: string = 'output.csv'): Promise<any[]> {
    const results: any[] = [];

    // Marcar tiempo de inicio
    const startTime = performance.now();

    // Verificar si el archivo CSV fue proporcionado
    if (!csvFile) {
        throw new Error("No se proporcionó un archivo CSV.");
    }

    // Crear un worker para procesar el archivo CSV
    try {
      await new Promise<void>((resolve, reject) => {
        const worker = new Worker(path.resolve('csvWorker2.js'), {
          workerData: { filePath: path.join(this.csvDirectoryPath2, csvFile) }
        });

        worker.on('message', (data) => {
          // Recibir datos en fragmentos y combinar con los resultados
          results.push(...data);
        });
        
        worker.on('error', (err) => reject(err));
        
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          } else {
            resolve();  // Finalización exitosa
          }
        });
      });

    } catch (error) {
      console.error(`Error procesando el archivo CSV: ${error.message}`);
    }

    // Marcar tiempo de finalización
    const endTime = performance.now();

    return results;
  }

  async getDatasetByYear(year: number, continente ?:string): Promise<any[]> {
    const results: any[] = [];
    const startTime = performance.now();

    // Leer los archivos en el directorio
    const files = await this.readdir(this.csvDirectoryPath3);

    // Filtrar el archivo que contiene el año en el nombre
    const filteredFiles = files.filter(file => file.includes(year.toString()));

    if (filteredFiles.length === 0) {
      throw new Error(`No se encontró dataset para el año ${year}`);
    }

    const filePath = path.join(this.csvDirectoryPath3, filteredFiles[0]);

    // Procesar el archivo CSV con un worker
    try {
      await new Promise<void>((resolve, reject) => {
        const worker = new Worker(path.resolve('csvWorker3.js'), {
          workerData: { filePath }
        });

        worker.on('message', (data) => {
          results.push(...data);
        });

        worker.on('error', (err) => reject(err));

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          } else {
            resolve();
          }
        });
      });

    } catch (error) {
      console.error(`Error procesando el dataset del año ${year}: ${error.message}`);
    }

    const endTime = performance.now();
    console.log(`CSV Processing Time for Year ${year}: ${(endTime - startTime).toFixed(2)} ms`);

    return results;
  }



}
