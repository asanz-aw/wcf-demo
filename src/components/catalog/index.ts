import * as catalog from '@easterngraphics/wcf/modules/eaiws/catalog';
import { HtmlUtils } from '../../utils';
import './index.css';
import * as cf from '@easterngraphics/wcf/modules/cf';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket';
import AWVariantCodeUtils from '../basket/AWVariantCodeUtils';
import { AWPriceService } from '../basket/AWPriceService';

import { MultiPropertyProvider, Property, PropertyChangedResult, PropertyClass, PropertyValue, groupProperties } from '@easterngraphics/wcf/modules/core/prop';
import { AppSettings } from '@easterngraphics/wcf/modules/core';
/**
 * UI for navigation through a catalog.
 * Calls callback if an articles was clicked, so he can be inserted.
 */
export class CatalogUI {
    private catalogService: catalog.CatalogService;
    private catalogPath: Array<string>; // stores the current path in the catalog ["root name", "level1 name", "level2 name", ...]
    private onInsertArticle: (item: catalog.ArticleCatalogItem) => Promise<void>; // callback if user clicks on a article
    private onInsertContainer: (item: catalog.CatalogItem) => Promise<void>; // callback if user clicks on a container
    private showingSearchResults = false; // indicates if we are currently showing the results of a search query
    private articleManager: any; // add a property for articleManager
    private htmlContainer: HTMLElement;
    private htmlContainerTestResults: HTMLElement;
    private htmlContainerTestResultsSummary: HTMLElement;
    private itemsContainer: HTMLElement;
    private searchBar: HTMLDivElement;
    private readonly lookupOptions: catalog.LookupOptions;
    private pricesTable: HTMLTableElement;
  private priceService:AWPriceService  = new AWPriceService();
    constructor(
        htmlContainer: HTMLElement,
        htmlContainerTestResults: HTMLElement,
        htmlContainerTestResultsSummary: HTMLElement,
        catalogService: catalog.CatalogService,
        onInsertArticle: (item: catalog.ArticleCatalogItem) => Promise<void>,
        onInsertContainer: (item: catalog.CatalogItem) => Promise<void>,
        articleManager: cf.ArticleManager
    ) {
        this.catalogService = catalogService;
        this.catalogPath = []; // shows all entries, can be filled up to start with an more specific path
        this.onInsertArticle = onInsertArticle;
        this.htmlContainer = htmlContainer;
        this.articleManager = articleManager; // add a property for articleManager
        this.htmlContainer = htmlContainer;
        this.htmlContainerTestResults = htmlContainerTestResults;
        this.htmlContainerTestResultsSummary = htmlContainerTestResultsSummary;
        this.lookupOptions = new catalog.LookupOptions();
        this.lookupOptions.itemTypes = [
            'Article',
            'Folder',
            'Container',
            'Information'
        ];
        this.lookupOptions.displayMode = 'AllVisible';

        this.searchBar = this.htmlContainer.appendChild(this.createSearchBar());
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'catalog-items'
        this.htmlContainer.appendChild(this.itemsContainer);
        void this.createCatalogItems();
    }

    private createSearchBar(): HTMLDivElement {
        const searchBar: HTMLDivElement = document.createElement('div');
        searchBar.className = 'catalog-search';

        const input: HTMLInputElement = document.createElement('input');
        input.className = 'catalog-search-input';
        searchBar.appendChild(input);

        const submit: HTMLButtonElement = document.createElement('button');
        submit.innerText = 'Test \'em all!!!';
        submit.onclick = this.onSearchCatalogClick.bind(this, input);
        searchBar.appendChild(submit);
        return searchBar;
    }

    private async onSearchCatalogClick(inputField: HTMLInputElement): Promise<void> {
 
        if (inputField.value == null || inputField.value.trim() === '') {
            return;
        }

        HtmlUtils.removeAllChildren(this.htmlContainerTestResults);
        const copyButton = this.createCopyButton();
        this.htmlContainerTestResults.appendChild(copyButton);

        const skus = inputField.value.split(',');
        this.pricesTable = this.createPricesTable();
        for (const sku of skus) {
            
          if (sku.trim() !== '') {
            await this.getOneProduct(sku.trim());
          }
        }
       
       // await this.getOneProduct(inputField.value);
      
    return 
      /*
      if (this.catalogPath == null || this.catalogPath.length === 0 || inputField.value === '') {
            return;
        }
        HtmlUtils.removeAllChildren(this.itemsContainer);
        this.showingSearchResults = true;

        const parameterSet: catalog.SearchParameterSet = new catalog.SearchParameterSet();
        parameterSet.catalogIds = [this.catalogPath[0]]; // only search in the whole catalog is currently possible
        parameterSet.query = inputField.value;
        parameterSet.numberOfHits = 100;
        parameterSet.flags = ['FolderText'];
        const foundItems: catalog.TopCatalogItems | undefined = await this.catalogService.searchCatalogItems(parameterSet, this.lookupOptions);

        this.itemsContainer.appendChild(this.createBackButton());
        if (foundItems != null) {
            foundItems.scoredItems.forEach((item) => {
                this.itemsContainer.appendChild(this.createCatalogItem(item.item));
            });
        }*/

    } 

 



    private async createCatalogItems(): Promise<void> {
        // show search bar only if we have entered a catalog, because we can not search over all catalogs (of all manufacturers)
        if (this.catalogPath.length === 0) {
            this.searchBar.style.display = 'none';
        } else {
            this.searchBar.style.display = 'block';
        }
        HtmlUtils.removeAllChildren(this.itemsContainer);

        
        const catalogItems: Array<catalog.CatalogItem> = await this.catalogService.listCatalogItems(this.catalogPath, this.lookupOptions);
///////////////////////////////////////        
        // console.log(catalogItems);
/*
for (const item of catalogItems) {
 

    console.log(item);
   // const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
    //console.log(element);

}
    */
        
///////////////////////////////////////

    

        if (this.catalogPath.length > 0) {
            this.itemsContainer.appendChild(this.createBackButton());
        }
        catalogItems.forEach((item) => { this.itemsContainer.appendChild(this.createCatalogItem(item)); });
    }


    
    /**
    * Creates a back button to go back to previous folder.
    */
    private createBackButton(): HTMLElement {
        const item: HTMLDivElement = document.createElement('div');
        item.className = 'catalog-item folder';
        item.onclick = this.onBackClick.bind(this);
        item.innerHTML = `
                <div class="catalog-item-label">back</div>
            `;
        return item;
    }

    private async onBackClick(): Promise<void> {
        if (this.showingSearchResults) {
            this.showingSearchResults = false;
        } else {
            this.catalogPath.pop();
        }
        await this.createCatalogItems();
    }

    private createCatalogItem(catalogItem: catalog.CatalogItem): HTMLElement {
        const item: HTMLDivElement = document.createElement('div');
        item.className = 'catalog-item' + (catalogItem.type === 'Folder' ? ' folder' : '');
        item.onclick = this.onItemClick.bind(this, catalogItem);
        item.innerHTML = `
            <img class="catalog-item-icon" src=${catalogItem.icon}></img>
            <div class="catalog-item-label">${catalogItem.label}</div>
        `;
        return item;
    }

    private async onItemClick(item: catalog.CatalogItem): Promise<void> {
 

/////////////////////////////////////////////////////
   // await this.getAllCatalogItems(); ////////////////
/////////////////////////////////////////////////////

if (item.type === 'Article') {
            if (item instanceof catalog.ArticleCatalogItem) {
                await this.onInsertArticle(item);
                this.playWithCatalogItem(item);
            }
        } else if (item.type === 'Container') {
            await this.onInsertContainer(item);
        } else if (item.type === 'Information') {
            this.downloadPDF(item);
        } else if (item.type === 'Folder') {
            if (this.showingSearchResults) { // if the folder is from a search result, we need to setup the catalog path to that folder
                this.catalogPath = await this.catalogService.getCatalogPath(item.catalogId, item.catalogNodeKey);
                this.showingSearchResults = false;
            } else {
                this.catalogPath.push(item.name);
            }
            await this.createCatalogItems();
        }

    }

    /**
     * Searches resources for a PDF and downloads it.
     */
    private downloadPDF(item: catalog.CatalogItem): void {
        if (item.resources != null) {
            for (const resource of item.resources) {
                const value: string | undefined = resource.value;
                if (value != null && value.startsWith('application/pdf')) {
                    const url: string = value.substr(value.indexOf(';') + 1);
                    window.location.href = url;
                    break;
                }
            }
        }
    }


//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

    private async getAllCatalogItems(): Promise<void> {
        console.log('getAllCatalogItems init');
        const allItems: catalog.CatalogItem[] = [];
        const traverseCatalog = async (path: string[]): Promise<void> => {
            const items = await this.catalogService.listCatalogItems(path, this.lookupOptions);
            for (const item of items) {
                allItems.push(item);
                if (item.type === 'Folder') {
                    await traverseCatalog([...path, item.name]);
                }
            }
        };
        await traverseCatalog(this.catalogPath);
       //await this.getBasketArticle();
      
        const articles = allItems.filter(item => item.type === 'Article') as catalog.ArticleCatalogItem[];
       
    
       
       
       

        // if (item instanceof catalog.ArticleCatalogItem) {
        //     await this.onInsertArticle(item);
        // }






    }

    private async getBasketArticle(): Promise<void> {
        const basketItems = await this.catalogService.listCatalogItems(['basket'], this.lookupOptions);
 
    }
    

private async playWithCatalogItem(item:catalog.ArticleCatalogItem) {


    if (this.articleManager.getProperties == null) {
        const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
        
        const articleProperties = await element.getProperties();
     

        if (articleProperties != null) {
        ;
            for (const property of articleProperties!) {
                console.log(property.key)
                if (property.key =="[Character]AWD_AWSERIE__ASIENTO__PLAF") {   
                    console.log(property);
                    console.log(await property.getChoices());
                }
                
                //console.log (property.key);
                //property.setValue("7");

            }
               
        }
        
    }

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////


  private async onInsertCatalogArticle(article: catalog.ArticleCatalogItem): Promise<void> {
    const element: cf.MainArticleElement = await this.articleManager.insertArticle(article);
  this.playWithCatalogItem(article);    
    }
 
    private async getOneProduct(sku: string): Promise<void> {
      // Recupera los datos de precios de la API
      const response = await fetch(`http://localhost:13000/precio/${sku}`);
      const priceData = await response.json();
    
      // Configura los parámetros de búsqueda
      const parameterSet: catalog.SearchParameterSet = new catalog.SearchParameterSet();
      parameterSet.catalogIds = [this.catalogPath[0]];
      parameterSet.query = sku;
      parameterSet.numberOfHits = 100;
      parameterSet.flags = ['FolderText'];
      const foundItems: catalog.TopCatalogItems | undefined = await this.catalogService.searchCatalogItems(parameterSet, this.lookupOptions);
    
      // Constantes para las propiedades y prefijos
      const AWD_TAPICERIA = "[Character]AWD_AWOPCION__TAPICERIA";
      const AWD_SERIE_TAPICERIA = "[Character]AWD_LISTAS__TAPICERIA";
      const prefix_SERIE_TAP = "AWSERIE_ASIE";
    
      // Añade la tabla de resultados al contenedor
      this.htmlContainerTestResults.appendChild(this.pricesTable);
    
      // Inicializa los contadores para coincidencias y discrepancias
      let priceMatches = 0;
      let priceDiscrepancies = 0;
    
      // Array to store price errors
      const priceErrors: { sku: string, variantCode: string, price: string, sapPrice: string }[] = [];

      // Función auxiliar para procesar la variante, comparar precios y actualizar la tabla y contadores
      const processVariant = async (element: cf.MainArticleElement): Promise<void> => {
        // Crea el código de variante según el artículo y las opciones seleccionadas
        const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
        // Recupera el precio según el SKU y el código de variante
        const priceResponse = await this.priceService.fetchPrice(sku, newVariantCode);
        const price = priceResponse?.price ?? "Price not available";
        
        // Extrae el valor de la serie a partir del código de variante
        const variantCodeParts = newVariantCode.split(';');
        let serieValue = variantCodeParts.find(part => part.includes(prefix_SERIE_TAP))?.split('=')[1] ?? 'N/A';
        if (serieValue === 'N/A') {
          serieValue = (variantCodeParts.find(part => part.includes('AWSERIE'))?.split('=')[1] ?? 'N/A');
            if (!isNaN(Number(serieValue)) && Number(serieValue) >= 1 && Number(serieValue) <= 11 || serieValue === 'Z') {
            // if (["0","1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].includes(serieValue)) {
            //    serieValue = `_${serieValue}`;
            // }
          }

        }
    
        // Busca en los datos externos el precio asociado a la serie
        let priceFromData = priceData.find((data: any) => data[serieValue] !== undefined)?.[serieValue] ?? "SAP not available";
        if (priceFromData !== "SAP not available") {
            if (priceFromData.toString().includes('.')) {
              const parts = priceFromData.toString().split('.');
              parts[1] = parts[1].padEnd(3, '0');
              priceFromData = parts.join('.') + ",00€";
            } else {
              priceFromData += ",00€";
            }
        }
           
        const isEqual = price.toString() === priceFromData.toString() ? "✅" : "❌";
    
        if (!isEqual) {
          priceErrors.push({ sku, variantCode: newVariantCode, price: price.toString(), sapPrice: priceFromData });
          console.log(`SKU: ${sku} - Serie Value: ${serieValue} - Price: ${price.toString()} - Price from Data: ${priceFromData} - Equal: ${isEqual}`);
          console.log(`Variant Code: ${newVariantCode}`);
        }
      
        // Añade la fila a la tabla de resultados
        this.addPriceRow(this.pricesTable, sku, serieValue, price.toString(), priceFromData, isEqual);
    
        // Actualiza los contadores según la comparación
        if (isEqual === "✅") {
          priceMatches++;
        } else {
          priceDiscrepancies++;
        }
      };
    
      // Si se han encontrado artículos, procesa cada uno
      if (foundItems) {
        for (const scoredItem of foundItems.scoredItems) {
          const item = scoredItem.item;
          if (item instanceof catalog.ArticleCatalogItem) {
            // Inserta el artículo y obtiene sus propiedades
            const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
            const articleProperties = await element.getProperties();
            //TEST-mesas  console.log(`Opción seleccionada: ${choices[i].value}`);
            if (articleProperties) {
            //TEST-mesas  console.log(articleProperties);
              for (const property of articleProperties) {
                // Procesa únicamente la propiedad de tapicería (o la de serie de tapicería)
                if (property.key === AWD_TAPICERIA || property.key === AWD_SERIE_TAPICERIA) {
                  const choices = await property.getChoices();
              //TEST-mesas    console.log(`Propiedad: ${property.key}`);
                //TEST-mesas  console.log(choices);
                  if (choices && choices.length > 0) {
                    // Itera las opciones de la propiedad
                    
                    for (let i = (choices.length === 2) ? 1 : 0; i < choices.length; i++) {
                      await property.setValue(choices[i].value);
    
                      // Si la opción es 'STAP', se procesa la variante
                      if (choices[i].value === 'STAP') {
                        await processVariant(element);
                      }
    
                      // Actualiza las propiedades tras seleccionar la opción
                      const propsAfterOption = await element.getProperties();
                      if (propsAfterOption) {
                        // Busca la propiedad de material (por ejemplo, tela o cuero)
                        const materialProperty = propsAfterOption.find(
                          prop => prop.key.startsWith("[Character]AWD_LISTAS") && prop.key.endsWith("TAPICERIA")
                        );
                        if (materialProperty) {
                          const materialChoices = await materialProperty.getChoices();
                          if (materialChoices && materialChoices.length > 0) {
                            for (const material of materialChoices) {
                              await materialProperty.setValue(material.value);
                              const propsAfterMaterial = await element.getProperties();
                              if (propsAfterMaterial) {
                                // Busca la propiedad de serie
                                const serieProperty = propsAfterMaterial.find(
                                  prop => prop.key.startsWith("[Character]AWD_SERIE") && prop.key.endsWith("TAPICERIA")
                                );
                                if (serieProperty) {
                                  const serieChoices = await serieProperty.getChoices();
                                  if (serieChoices) {
                                    for (const serie of serieChoices) {
                                      await serieProperty.setValue(serie.value);
                                      await processVariant(element);
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    
      // Muestra al final la cantidad de coincidencias y discrepancias por consola
      console.log(`Total de coincidencias de precio: ${priceMatches}`);
      console.log(`Total de discrepancias: ${priceDiscrepancies}`);
//----------
      // Summary section
      const summarySection = document.createElement("div");
      summarySection.className = "summary-section";
      this.htmlContainerTestResultsSummary.appendChild(summarySection);

      const summaryTitle = document.createElement("h3");
      summaryTitle.innerText = "Summary";
      summarySection.appendChild(summaryTitle);

      const summaryContent = document.createElement("div");
      summarySection.appendChild(summaryContent);

      const successCount = document.createElement("p");
      successCount.innerText = `Total Successes: ${priceMatches}`;
      summaryContent.appendChild(successCount);

      const errorCount = document.createElement("p");
      errorCount.innerText = `Total Errors: ${priceDiscrepancies}`;
      summaryContent.appendChild(errorCount);

      if (priceDiscrepancies > 0) {
        const errorDetails = document.createElement("div");
        errorDetails.className = "error-details";
        summaryContent.appendChild(errorDetails);

        const errorTitle = document.createElement("h4");
        errorTitle.innerText = "Error Details";
        errorDetails.appendChild(errorTitle);

        const errorTable = document.createElement("table");
        errorTable.className = "error-table";
        errorDetails.appendChild(errorTable);

        const errorThead = document.createElement("thead");
        errorThead.innerHTML = `
          <tr>
            <th>SKU</th>
            <th>Variant Code</th>
            <th>Price</th>
            <th>SAP Price</th>
          </tr>
        `;
        errorTable.appendChild(errorThead);

        const errorTbody = document.createElement("tbody");
        errorTable.appendChild(errorTbody);

        // Add error rows
        for (const error of priceErrors) {
          const errorRow = document.createElement("tr");

          const skuCell = document.createElement("td");
          skuCell.innerText = error.sku;
          errorRow.appendChild(skuCell);

          const variantCell = document.createElement("td");
          variantCell.innerText = error.variantCode;
          errorRow.appendChild(variantCell);

          const priceCell = document.createElement("td");
          priceCell.innerText = error.price;
          errorRow.appendChild(priceCell);

          const sapPriceCell = document.createElement("td");
          sapPriceCell.innerText = error.sapPrice;
          errorRow.appendChild(sapPriceCell);

          errorTbody.appendChild(errorRow);
        }
      }
//----------

    }
    
    
// Dentro de tu clase CatalogUI, agrega estos métodos:
/**
 * Crea un botón para copiar toda la tabla de precios.
 */
private createCopyButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerText = "Copy Results";
  button.onclick = this.copyTableToClipboard.bind(this);
  return button;
}

/**
 * Copia el contenido de la tabla de precios al portapapeles.
 */
private copyTableToClipboard(): void {
  const table = this.htmlContainerTestResults.querySelector(".prices-table");
  
  const tableHtml = table?.outerHTML ?? '';
  navigator.clipboard.writeText(tableHtml).then(() => {
  //  alert("Table copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy table: ", err);
  });
}


/**
 * Crea la tabla HTML para mostrar los precios.
 */
private createPricesTable(): HTMLTableElement {
    const table = document.createElement("table");
    table.className = "prices-table";
    
    // Cabecera de la tabla
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>SKU</th>
        <th>Serie</th>
        <th>Precio</th>
          <th>SAP</th>
            <th>Igual</th>
      </tr>
    `;
    table.appendChild(thead);
  
    // Cuerpo de la tabla
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    return table;
  }
  
  /**
   * Agrega una fila a la tabla con los datos recibidos.
   * @param table La tabla HTML donde se agregará la fila.
   * @param sku El SKU del producto.
   * @param variantCode El código de variante (o serie) generado.
   * @param price El precio obtenido.
   */
  private addPriceRow(table: HTMLTableElement, sku: string, variantCode: string, price: string, sapPrice: string, isEqueal: string ): void {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    
    const row = document.createElement("tr");
  
    const skuCell = document.createElement("td");
    skuCell.innerText = sku;
    row.appendChild(skuCell);
  
    const variantCell = document.createElement("td");
    variantCell.innerText = variantCode;
    row.appendChild(variantCell);
  
    const priceCell = document.createElement("td");
    priceCell.innerText = price;
    row.appendChild(priceCell);
    const priceSapCell = document.createElement("td");
    priceSapCell.innerText = sapPrice;
    row.appendChild(priceSapCell);
    const isEqualPriceCell = document.createElement("td");
    isEqualPriceCell.innerText = isEqueal;
    row.appendChild(isEqualPriceCell);
  
    tbody.appendChild(row);
  }
  

   }


