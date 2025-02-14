/**
 * Clase que se encarga de parsear y comparar precios,
 * eliminando símbolos de moneda y separadores, para
 * trabajar internamente con valores numéricos.
 */
export class PriceComparator {
  /**
   * Convierte un precio (string o number) a un número.
   * Elimina símbolos de moneda y separadores de miles/decimales.
   *
   * @param price - El precio a parsear.
   * @returns El precio en formato numérico o NaN si el precio no está disponible.
   */
  public static parsePrice(price: string | number): number {
    if (typeof price === 'number') {
      return price;
    }
    // Si el precio es "Price not available", se devuelve NaN para indicar que no está disponible.
    if (price.trim() === 'Price not available') {
      return NaN;
    }
    // Elimina cualquier caracter que no sea dígito, coma, punto o signo negativo
    let cleaned = price.replace(/[^0-9,.-]/g, '');
    
    // Si existe tanto punto como coma, se asume que:
    // - el punto es separador de miles y la coma es separador decimal
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, ''); // elimina los puntos (miles)
      cleaned = cleaned.replace(',', '.');  // convierte la coma en punto decimal
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Si solo existe la coma, se asume que es el separador decimal
      cleaned = cleaned.replace(',', '.');
    }
    
    const parsed = parseFloat(cleaned);
    return parsed;
  }

  /**
   * Compara dos precios, parseándolos primero a números.
   *
   * @param priceA - Precio proveniente del servicio A.
   * @param priceB - Precio proveniente del servicio B.
   * @returns true si los precios son iguales y ambos están disponibles; false en caso contrario.
   */
  public static comparePrices(priceA: string | number, priceB: string | number): boolean {
    const parsedA = this.parsePrice(priceA);
    const parsedB = this.parsePrice(priceB);
    // Si alguno de los precios no está disponible (NaN), se considera que son distintos.
    if (isNaN(parsedA) || isNaN(parsedB)) {
      return false;
    }
    return parsedA === parsedB;
  }

  /**
   * Devuelve un símbolo según la comparación de dos precios:
   * - "✅" si son iguales.
   * - "❌" si son distintos.
   *
   * @param priceA - Precio del primer servicio.
   * @param priceB - Precio del segundo servicio.
   * @returns El símbolo correspondiente a la comparación.
   */
  public static comparePricesSymbol(priceA: string | number, priceB: string | number): string {
    return this.comparePrices(priceA, priceB) ? "✅" : "❌";
  }
}
