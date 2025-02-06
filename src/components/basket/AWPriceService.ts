// src/services/PriceService.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Define la estructura esperada de la respuesta del servicio.
 * Puedes ajustarla según la respuesta real del endpoint.
 */
export interface AWPriceServiceResponse {
  // Ejemplo de campos; actualiza según corresponda
  price?: number;
  currency?: string;
  [key: string]: any;
}

/**
 * Servicio para obtener el precio del producto a través de la API.
 */
export class AWPriceService {
  private axiosInstance: AxiosInstance;
  private static AW_PRICES_ENDPOINT = '/en/quoter/ajax/priceservice/';
  private static AW_BASE_URL = 'https://staging-5em2ouy-2qy5gku52uav2.eu-3.magentosite.cloud/en/quoter/ajax/priceservice/';
  /**
   * @param baseURL - La URL base del servicio (por defecto se utiliza la URL de production)
   */
  constructor(private baseURL: string = AWPriceService.AW_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Obtiene el precio del servicio para un producto y variante especificados.
   * 
   * @param sku - El SKU del producto.
   * @param variantCode - El código de variante con todas las opciones configuradas.
   * @returns Una promesa que resuelve con la respuesta del servicio.
   * @throws Error si ocurre algún problema durante la consulta.
   */
  public async fetchPrice(sku: string, variantCode: string): Promise<AWPriceServiceResponse> {
    // Se define el endpoint relativo a la URL base.
    const endpoint = AWPriceService.AW_PRICES_ENDPOINT;
    const payload = this.createFormData({ sku, variant_code: variantCode });

    try {
      const response: AxiosResponse<AWPriceServiceResponse> = await this.axiosInstance.post(endpoint, payload);
      console.info('Respuesta del Price Service:', response.data);
      return response.data;
    } catch (error: any) {
      // Se extrae información detallada del error, si está disponible.
      const errorMsg = error.response?.data || error.message;
      console.error('Error al obtener el precio del servicio:', errorMsg);
      throw new Error(`Error en fetchPrice: ${errorMsg}`);
    }
  }

  /**
   * Crea un objeto FormData a partir de un objeto clave-valor.
   * 
   * @param data - Un objeto donde cada propiedad se convertirá en un campo de FormData.
   * @returns El objeto FormData resultante.
   */
  private createFormData(data: Record<string, string>): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    return formData;
  }
}
