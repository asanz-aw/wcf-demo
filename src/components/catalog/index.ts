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
    private itemsContainer: HTMLElement;
    private searchBar: HTMLDivElement;
    private readonly lookupOptions: catalog.LookupOptions;
  private priceService:AWPriceService  = new AWPriceService();
    constructor(
        htmlContainer: HTMLElement,
        htmlContainerTestResults: HTMLElement,
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
        await this.getOneProduct(inputField.value);
      
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
        // Se configura el parámetro de búsqueda (en este caso se asume que catalogPath[0] ya está definido)
        const parameterSet: catalog.SearchParameterSet = new catalog.SearchParameterSet();
        parameterSet.catalogIds = [this.catalogPath[0]];
        parameterSet.query = sku;
        parameterSet.numberOfHits = 100;
        parameterSet.flags = ['FolderText'];
        const foundItems: catalog.TopCatalogItems | undefined = await this.catalogService.searchCatalogItems(parameterSet, this.lookupOptions);
        
        // Arrays para los keys de las propiedades (ajusta según tus necesidades)
        const AWD_TAPICERIA = "[Character]AWD_AWOPCION__TAPICERIA"; //opcion que se seleccion y salen las opciones de asientos ASP o ARP
        const AWD_AWOPCION__TAPICERIA = ["", "[Character]AWD_LISTAS__ASP__TAPICERIA", "[Character]AWD_LISTAS__ARP__TAPICERIA"]; //las opciones popsibles 
        const AWD_AWSERIE__TAPICERIA  = ["", "[Character]AWD_SERIE__ASP__TAPICERIA", "[Character]AWD_SERIE__ARP__TAPICERIA"]; //opcion con las series 
        const prefix_SERIE_TAP = "AWSERIE_ASIE"; // prefijo para las series de tapiceria para la tabla 


        // Crea la tabla de precios y la añade al contenedor (por ejemplo, al htmlContainer)
        const pricesTable = this.createPricesTable();
        this.htmlContainerTestResults.appendChild(pricesTable);
      
        if (foundItems != null) {
          for (const scoredItem of foundItems.scoredItems) {
            const item = scoredItem.item;
            if (item instanceof catalog.ArticleCatalogItem) {
              // Inserta el artículo en el articleManager
              const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
              const articleProperties = await element.getProperties();
              if (articleProperties != null) {
                // Recorre las propiedades en busca de la opción de tapicería
                for (const property of articleProperties) {
                  if (property.key === AWD_TAPICERIA) {    //Opciones de tapiceria 
                    // Obtiene las opciones disponibles
                    const choices = await property.getChoices();
                    console.log(AWD_TAPICERIA);
                    console.log(choices);
                    if (choices != null && choices.length > 1 && choices.length <= AWD_AWOPCION__TAPICERIA.length) {
                      // Itera desde la opción 1 (ignorando el valor vacío en índice 0)
                      for (let option = 1; option < choices.length; option++) {
                        // Selecciona la opción (por ejemplo, ASP o ARP)
                        await property.setValue(choices[option].value);
                        const propsAfterOption = await element.getProperties(); 
                        console.log(choices[option].value);
                        console.log(propsAfterOption);
                        if (propsAfterOption != null) {
                          for (const prop of propsAfterOption) {
                            // Busca la propiedad de material (tela o cuero)
                            if (prop.key === AWD_AWOPCION__TAPICERIA[option]) {
                              const materialChoices = await prop.getChoices();
                              if (materialChoices != null && materialChoices.length > 1) {
                                for (const material of materialChoices) {
                                  await prop.setValue(material.value);
                                  const propsAfterMaterial = await element.getProperties(); 
                                  if (propsAfterMaterial != null) {
                                    for (const propSerie of propsAfterMaterial) {
                                      // Busca la propiedad de serie
                                      if (propSerie.key === AWD_AWSERIE__TAPICERIA[option]) {
                                        const serieChoices = await propSerie.getChoices();
                                        if (serieChoices != null) {
                                          for (const serie of serieChoices) {
                                            await propSerie.setValue(serie.value);           
                                            // Crea el código de variante según el artículo y las opciones seleccionadas
                                            const newVariantCode = await AWVariantCodeUtils.createFromArticle(element); 
                                            // Recupera el precio utilizando el SKU y el nuevo código de variante
                                            const priceResponse = await this.priceService.fetchPrice(sku, newVariantCode);
                                            const price = priceResponse?.price ?? "Price not available";
                                            const variantCodeParts = newVariantCode.split(';');
                                            const serieValue = variantCodeParts.find(part => part.includes(prefix_SERIE_TAP))?.split('=')[1] ?? 'N/A';
                                            console.log(`SKU: ${sku} - Serie Value: ${serieValue} - Price: ${price} `);
                                            // Agrega una fila a la tabla con los datos
                                            this.addPriceRow(pricesTable, sku, serieValue, price.toString());
                                            
                                            // Opcional: podrías esperar o realizar otras acciones antes de pasar a la siguiente iteración
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
          }
        }
      }
      
    
// Dentro de tu clase CatalogUI, agrega estos métodos:

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
        <th>Código de Variante</th>
        <th>Precio</th>
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
  private addPriceRow(table: HTMLTableElement, sku: string, variantCode: string, price: string): void {
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
  
    tbody.appendChild(row);
  }
  

   }


