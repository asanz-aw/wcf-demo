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
    private itemsContainer: HTMLElement;
    private searchBar: HTMLDivElement;
    private readonly lookupOptions: catalog.LookupOptions;
  private priceService:AWPriceService  = new AWPriceService();
    constructor(
        htmlContainer: HTMLElement,
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
        submit.innerText = 'search';
        submit.onclick = this.onSearchCatalogClick.bind(this, input);
        searchBar.appendChild(submit);
        return searchBar;
    }

    private async onSearchCatalogClick(inputField: HTMLInputElement): Promise<void> {
        await this.getOneProduct();
      
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



   private async getOneProduct() {

const sku = "So1410";   


    const parameterSet: catalog.SearchParameterSet = new catalog.SearchParameterSet();
         parameterSet.catalogIds = [this.catalogPath[0]]; // only search in the whole catalog is currently possible
        parameterSet.query = sku;
        parameterSet.numberOfHits = 100;
        parameterSet.flags = ['FolderText'];
        const foundItems: catalog.TopCatalogItems | undefined = await this.catalogService.searchCatalogItems(parameterSet, this.lookupOptions);
      

const AWD_AWOPCION__TAPICERIA = ["", "[Character]AWD_LISTAS__ASP__TAPICERIA", "[Character]AWD_LISTAS__ARP__TAPICERIA"];
const AWD_AWSERIE__TAPICERIA  = ["", "[Character]AWD_SERIE__ASP__TAPICERIA", "[Character]AWD_SERIE__ARP__TAPICERIA"];

        if (foundItems != null) {
            // console.log(foundItems);
            for (const scoredItem of foundItems.scoredItems) {
                const item = scoredItem.item;
                if (item instanceof catalog.ArticleCatalogItem) {
                    const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
                    const articleProperties = await element.getProperties();
                    if (articleProperties != null) {
                        for (const property of articleProperties) {

                             if (property.key =="[Character]AWD_AWOPCION__TAPICERIA") {   //Tipo asiento ASP o ARP
                               
                              //  console.log(await property.getChoices());
/////////////////////////////////////////////////////////////////////////
const choices = await property.getChoices();

if (choices != null && choices.length > 1 && choices.length <= AWD_AWOPCION__TAPICERIA.length) {
for (let option = 1; option < choices.length; option++) {


    await property.setValue(choices[option].value); //ASP
    const articleProperties = await element.getProperties(); 
    if (articleProperties != null) {
        for (const property of articleProperties) {
            //sleccionar materia "[Character]AWD_LISTAS__ASP__TAPICERIA
            if (property.key == AWD_AWOPCION__TAPICERIA[option]) {    //tela o cuero
                const choices = await property.getChoices();
                if (choices != null && choices.length > 1) {
                for (const choice of choices) {
                    await property.setValue(choice.value); //tela
    
                    const articleProperties = await element.getProperties(); 
                    if (articleProperties != null) {
                    for (const property of articleProperties) {
                        if (property.key == AWD_AWSERIE__TAPICERIA[option]) { //serie  
                            const choices = await property.getChoices();
                            if (choices != null) {
                                for (const choice of choices) {
                                    await property.setValue(choice.value);
                                    
                                    const newVariantCode = await AWVariantCodeUtils.createFromArticle(element); 
                                    console.log (newVariantCode);
                                    const priceResponse = await this.priceService.fetchPrice(sku,newVariantCode );
                                    const price = priceResponse?.price ?? "Price not available";


                                   
                                }
                            }
                        }
    
                    }
    
                }
                
    
                }
    
            }
    
    
    
    
    
    }
    }
    // console.log(await AWVariantCodeUtils.createFromArticle(element));
    }
    
}  
    }
}
/////////////////////////////////////////////////////////////////////////

                             }
//StringProperty {mProvider: MainArticleElement, key: '', name: 'Seat options', class: 'AWD_AW_OPC_TAPIC', editable: true, …}


                            // const choices = await property.getChoices();
                            // if (choices != null) {
                            //     console.log(`Property: ${property.key}`);
                            //     for (const choice of choices) {
                            //         console.log(`Choice: ${choice}`);
                            //     }
                            // }
                        }
                    }
                }
            }
        }


   }


