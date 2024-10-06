import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Query('category') category: string, @Query('clase') clase?: string): Promise<any> {
    // Verificar si se ha proporcionado una categoría
    if (!category) {
      return {
        message: "Se necesita categoría",
        code: 400 // Cambié el código a 400 para indicar una mala solicitud
      };
    }

    // Verificar si la categoría es válida
    if (category !== 'post' && category !== 'prior') {
      return {
        message: "Categoría inválida. Debe ser 'post' o 'prior'.",
        code: 400 // También un código de error 400 para indicar que la solicitud es inválida
      };
    }

    try {
      // Llamar al servicio con la categoría
      const data = await this.appService.GetData(category, clase);
      return {
        message: "Datos obtenidos correctamente.",
        data: data, // Devolver los datos obtenidos
        code: 200 // Código de éxito
      };
    } catch (error) {
      return {
        message: error.message,
        code: 500 // Código de error interno
      };
    }
  }

  @Get('data2')
  async getData2(): Promise<any> {

    try {
      // Llamar al servicio con la categoría
      const data = await this.appService.GetData2();
      return {
        message: "Datos obtenidos correctamente.",
        data: data, // Devolver los datos obtenidos
        code: 200 // Código de éxito
      };
    } catch (error) {
      return {
        message: error.message,
        code: 500 // Código de error interno
      };
    }
  }

  @Get('data3')
  async getDatasetByYear(@Query('year') year: string,@Query('continente') continente?: string) : Promise<any> {
    var parsedYear = parseInt(year);

    try {
      // Obtener el dataset según el año
      const dataset = await this.appService.getDatasetByYear(parsedYear,continente);
      return {
        message: "Datos obtenidos correctamente.",
        data: dataset, // Devolver los datos obtenidos
        code: 200 // Código de éxito
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
