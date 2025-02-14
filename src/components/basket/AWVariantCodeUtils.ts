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
    'AW_TAPICERIA_TAP.SERIE_TAPICERIA',
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
      .filter((prop) => prop.propClass.startsWith(this.PROPERTY_PREFIX))
      .map((prop) => {
        const className = this.replaceCharacters(prop.propClass);
        const propName = this.replaceCharacters(prop.propName);
        return `${className}.${propName}=${prop.value.value}`;
      });
  }

  /**
   * Creates a variant code string from an article element.
   * Retrieves both item properties and article data and then builds the code.
   * @param article - The article element.
   * @returns A Promise that resolves to the variant code string.
   */
  public static async createFromArticle(article: cf.ArticleElement): Promise<string> {
    const itemProperties = await article.getItemProperties();
    const itemData = await article.getArticleData();
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

    const existingVariantCodes = itemProperties.article?.variantCode
      ? itemProperties.article.variantCode.split(this.DELIMITER)
      : [];

    const generatedVariantCodes = this.generateVariantArray(itemData.properties ?? []);

    // Combine existing and generated variant codes into a set to ensure uniqueness.
    let variantCodesSet = new Set<string>([
      ...existingVariantCodes,
      ...generatedVariantCodes,
    ]);

    // Filter out any variant codes that start with one of the defined prefixes.
    variantCodesSet = new Set(
      Array.from(variantCodesSet).filter(
        (value) => !this.FILTER_PREFIXES.some((prefix) => value.startsWith(prefix))
      )
    );

    // Amend the variant codes with Credenza Series adjustments.
    variantCodesSet = this.amendCredenzaSeries(itemProperties, variantCodesSet);

    // Amend variant codes with Series Mesa adjustments for Ruta Tables and return as a string.
    return this.amendSeriesMesaForRutaTables(variantCodesSet);
  }

  /**
   * Amends variant properties by updating series mesa values for ruta tables.
   * If a property starting with 'AW_TIPO_SOBRE_INF.AWSERIES_MESAS_INFERIOR' is found,
   * then for each property starting with 'AW_CONF_MESAS2.AWSERIES_MESAS' the value is amended.
   * @param variantCodes - Set of variant property strings.
   * @returns The concatenated variant code string.
   */
  private static amendSeriesMesaForRutaTables(variantCodes: Set<string>): string {
    const variantArray = Array.from(variantCodes);
    const seriesMesaInferior = variantArray.find((value) =>
      value.startsWith('AW_TIPO_SOBRE_INF.AWSERIES_MESAS_INFERIOR')
    );

    if (seriesMesaInferior) {
      const seriesMesaInferiorValue = seriesMesaInferior.split('=')[1] || '';
      const updatedCodes = variantArray.map((value) => {
        if (value.startsWith('AW_CONF_MESAS2.AWSERIES_MESAS')) {
          const originalValue = value.split('=')[1] || '';
          return `AW_CONF_MESAS2.AWSERIES_MESAS=${originalValue}${seriesMesaInferiorValue}`;
        }
        return value;
      });
      return updatedCodes.join(this.DELIMITER);
    }

    return variantArray.join(this.DELIMITER);
  }

  /**
   * Amends variant properties by combining series values for Credenza.
   * If a property starting with 'AW_CONF_SOBRE.AWSERIE_SOBRE' is found and
   * a corresponding series extension property exists, a new property is added with the concatenated value.
   * @param itemProperties - The item properties containing variant codes.
   * @param variantCodes - Set of variant property strings.
   * @returns The updated set of variant property strings.
   */
  private static amendCredenzaSeries(
    itemProperties: basket.ItemProperties,
    variantCodes: Set<string>
  ): Set<string> {
    const variantArray = Array.from(variantCodes);
    const sobreProperty = variantArray.find((value) =>
      value.startsWith('AW_CONF_SOBRE.AWSERIE_SOBRE')
    );

    if (sobreProperty) {
      const seriesSobreValue = sobreProperty.split('=')[1] || '';

      const seriesExtProperty = variantArray.find((value) =>
        value.startsWith('AW_TIPO_MAT_EXT.AWSERIE_EXT')
      );

      if (seriesExtProperty) {
        const seriesExtValue = seriesExtProperty.split('=')[1] || '';
        variantCodes.add(`AW_CONF_CREDENZA.AWSERIE_MESAS=${seriesExtValue}${seriesSobreValue}`);
      }
    }

    return variantCodes;
  }
}
