import * as cf from '@easterngraphics/wcf/modules/cf/ArticleElement';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket/';

export default class AWVariantCodeUtils {
  private static readonly DELIMITER = ';';
  private static readonly REPLACE_FROM = /__/g;
  private static readonly REPLACE_TO = '_';
  private static readonly PROPERTY_PREFIX = 'AW_';

  // Properties starting with any of these prefixes will be filtered out.
  private static readonly FILTER_PREFIXES: string[] = [
    'AW_TAPICERIA.AWTAPICERIA',
    'AW_TAPICERIA_ASP.SERIE',
    'AW_TAPICERIA_ASP.COLECCION',
    'AW_TAPICERIA_ARP.SERIE',
    'AW_TAPICERIA_ARP.COLECCION',
    'AW_TAPICERIA_ARP.AWTAPIZ',
    'AW_TAPICERIA_ASP.AWTAPIZ',
    'AW_BZT_TAP.AWTAPIZ_BZ',
    'AW_TAPICERIA.SERIE_TAPICERIA',
    'AW_TAPICERIA_TAP.SERIE_TAPICERIA'
  ];

  /**
   * Replaces double underscores with a single underscore.
   * @param input - The string to process.
   * @returns The modified string.
   */
  private static replaceCharacters(input: string): string {
    return input.replace(this.REPLACE_FROM, this.REPLACE_TO);
  }

  /**
   * Generates an array of variant strings from basket properties.
   * Only properties with a class starting with the designated prefix are considered.
   * @param properties - Array of basket properties.
   * @returns An array of variant strings.
   */
  private static generateVariantArray(properties: basket.Property[]): string[] {
    return properties
      .filter(prop => prop.propClass.startsWith(this.PROPERTY_PREFIX))
      .map(
        prop =>
          `${this.replaceCharacters(prop.propClass)}.${this.replaceCharacters(
            prop.propName
          )}=${prop.value.value}`
      );
  }

  /**
   * Creates a variant code string from an article element.
   * Retrieves both item properties and article data and then builds the code.
   * @param article - The article element.
   * @returns A Promise that resolves to the variant code string.
   */
  public static async createFromArticle(article: cf.ArticleElement): Promise<string> {
    const itemProperties: basket.ItemProperties = await article.getItemProperties();
    const itemData: basket.ArticleData = await article.getArticleData();
    return this.createVariantCode(itemProperties, itemData);
  }

  /**
   * Creates a variant code string from item properties and article data.
   * It builds a union of existing variant codes and generated codes from article data,
   * filters out unwanted properties, and applies special amendments.
   * @param itemProperties - The item properties containing variant codes.
   * @param itemData - The article data containing additional properties.
   * @returns The concatenated variant code string.
   */
  public static createVariantCode(
    itemProperties: basket.ItemProperties,
    itemData: basket.ArticleData
  ): string {
    if (!itemProperties || !itemData) {
      throw new Error('Invalid input: itemProperties or itemData is missing.');
    }

    let allVariantProperties: string[] = [];
    if (itemProperties.article?.variantCode) {
      allVariantProperties = itemProperties.article.variantCode.split(this.DELIMITER);
    }

    const itemDataVariantArray = this.generateVariantArray(itemData.properties ?? []);
    // Create a set to hold unique variant strings.
    let uniqueVariantProperties = new Set([
      ...allVariantProperties,
      ...itemDataVariantArray,
    ]);

    // Filter out any variant strings that start with one of the defined prefixes.
    uniqueVariantProperties = new Set(
      Array.from(uniqueVariantProperties).filter(
        value => !this.FILTER_PREFIXES.some(prefix => value.startsWith(prefix))
      )
    );

    return this.amendSeriesMesaForRutaTables(uniqueVariantProperties);
  }

  /**
   * Amends variant properties by updating series mesa values for ruta tables.
   * If a property starting with 'AW_TIPO_SOBRE_INF.AWSERIES_MESAS_INFERIOR' is found,
   * then for each property starting with 'AW_CONF_MESAS2.AWSERIES_MESAS' the value is prefixed.
   * @param variantProperties - Set of variant property strings.
   * @returns The concatenated variant code string.
   */
  private static amendSeriesMesaForRutaTables(variantProperties: Set<string>): string {
    const seriesMesaInferior = Array.from(variantProperties).find(value =>
      value.startsWith('AW_TIPO_SOBRE_INF.AWSERIES_MESAS_INFERIOR')
    );
    if (seriesMesaInferior) {
      const seriesMesaInferiorValue = seriesMesaInferior.split('=')[1];
      // Create an updated array where matching properties have their value amended.
      const updatedProperties = Array.from(variantProperties).map(value => {
        if (value.startsWith('AW_CONF_MESAS2.AWSERIES_MESAS')) {
          const originalValue = value.split('=')[1];
          return `AW_CONF_MESAS2.AWSERIES_MESAS=${originalValue}${seriesMesaInferiorValue}`;
        }
        return value;
      });
      return updatedProperties.join(this.DELIMITER);
    }
    return Array.from(variantProperties).join(this.DELIMITER);
  }
}

