import * as cf from '@easterngraphics/wcf/modules/cf/ArticleElement';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket/';

export default class AWVariantCodeUtils {
    private static readonly DELIMITER = ';';
    private static readonly REPLACE_FROM = /__/g;
    private static readonly REPLACE_TO = '_';
    private static readonly PROPERTY_PREFIX = 'AW_';
  
    private static replaceCharacters(input: string): string {
      return input.replace(this.REPLACE_FROM, this.REPLACE_TO);
    }
  
    private static generateVariantArray(properties: basket.Property[]): string[] {
      return properties
        .filter((prop) => prop.propClass.startsWith(this.PROPERTY_PREFIX))
        .map(
          (prop) => `${this.replaceCharacters(prop.propClass)}.${this.replaceCharacters(prop.propName)}=${prop.value.value}`
        );
    }
  
    /**
     * Creates a variant code string from an article by retrieving its properties and data.
     * @param article - The article element containing the necessary data.
     * @returns A Promise that resolves to the concatenated variant code string.
     */
    public static async createFromArticle(article: cf.ArticleElement): Promise<string> {
      // console.log('Article:', article);

      // const itemProperties: basket.ItemProperties = await article.getItemProperties();
      // console.log('Item Properties:', itemProperties);

      // const itemData: basket.ArticleData = await article.getArticleData();
      // console.log('Item Data:', itemData);

      // console.log('Item Properties Article:', itemProperties.article);
      // console.log('Item Properties Properties:', itemProperties);

      // //console.log('Item Data Properties:', itemData.properties);

      // itemData.properties?.forEach((property) => {
      //   console.log('Property:', property.propName);
      //   console.log('Property:', property);
      // });

      


      const itemProperties: basket.ItemProperties = await article.getItemProperties();
      const itemData: basket.ArticleData = await article.getArticleData();
      return this.createVariantCode(itemProperties, itemData);
    }
    
    /**
     * Creates a variant code string from item properties and article data.
     * @param itemProperties - The item properties containing variant codes.
     * @param itemData - The article data containing property details.
     * @returns The concatenated variant code string.
     */
    public static createVariantCode(itemProperties: basket.ItemProperties, itemData: basket.ArticleData
    ): string {
      if (!itemProperties || !itemData) {
        throw new Error('Invalid input: itemProperties or itemData is missing.');
      }
  
      let allVariantProperties: string[] = [];
      if (itemProperties.article?.variantCode) {
        allVariantProperties = itemProperties.article.variantCode.split(this.DELIMITER);
      }
  
      const itemDataVariantArray = this.generateVariantArray(itemData.properties ?? []);
      const uniqueVariantProperties = new Set([
        ...allVariantProperties,
        ...itemDataVariantArray,
      ]);
      

      uniqueVariantProperties.forEach((value) => {
        if (
          value.startsWith('AW_TAPICERIA.AWTAPICERIA') ||
          value.startsWith('AW_TAPICERIA_ASP.SERIE') ||
          value.startsWith('AW_TAPICERIA_ASP.COLECCION')||
          value.startsWith('AW_TAPICERIA_ARP.SERIE') ||
          value.startsWith('AW_TAPICERIA_ARP.COLECCION')  ||
          value.startsWith('AW_TAPICERIA_ARP.AWTAPIZ') ||
          value.startsWith('AW_TAPICERIA_ASP.AWTAPIZ') ||
          value.startsWith('AW_BZT_TAP.AWTAPIZ_BZ') ||
          value.startsWith('AW_TAPICERIA.SERIE_TAPICERIA') ||
          value.startsWith('AW_TAPICERIA_TAP.SERIE_TAPICERIA')
        ) {
          uniqueVariantProperties.delete(value);
        }
      });

      
      const allValuesString = Array.from(uniqueVariantProperties).join(this.DELIMITER);
   
      return allValuesString;
    }
  }
