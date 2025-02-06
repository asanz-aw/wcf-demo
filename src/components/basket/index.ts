import * as cf from '@easterngraphics/wcf/modules/cf';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket';
import { ProgressUI } from '../progress';
import './index.css';
import  AWVariantCodeUtils  from './AWVariantCodeUtils';
import { ArticlePropertyHelpers } from '@easterngraphics/wcf/modules/cf';
import { AWPriceService } from './AWPriceService';

/**
 * Shows commercial information about the current articles in the scene, like article number, price, sub articles etc.
 */
export class BasketUI {
    private articleManager: cf.ArticleManager;
    private onItemClicked: (item: cf.ArticleElement, event: MouseEvent) => void; // callback if user clicks on a basket item
    private htmlContainer: HTMLElement;
    private priceService:AWPriceService  = new AWPriceService();
    constructor(
        htmlContainer: HTMLElement,
        articleManager: cf.ArticleManager,
        onItemClicked: (item: cf.ArticleElement, event: MouseEvent) => void
    ) {
        this.articleManager = articleManager;
        this.onItemClicked = onItemClicked;
        this.htmlContainer = htmlContainer;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        articleManager.eventArticleChanged.addListener(this.updateBasket.bind(this)); // if a property of an article was changed, we need to update the basket
    }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

    private static AW_TAPICERIA = [ "AWSERIE__ASIENTO__PLAF", // ASP
                                    "AWSERIE", // TODO TAPIZADO
                                    "AWSERIE__ASIE__RESP__PLAF"]; //ARP 


    private static AW_TACOS = [ "TAW__LISTAS__TCSMAD",
                                "TAW__LISTAS__TCSBASC",
                                "TAW__LISTAS__TCSCANT",
                                "TAW__LISTAS__TCS4PFS",
                                "TAW__LISTAS__TCSEST",
                                "TAW__LISTAS__TCSBCF",
                                "TAW__LISTAS__TCSCOUVE",
                                "TAW__LISTAS__TCSRAG",
                                "TAW__LISTAS__TCSCEN4",
                                "TAW__LISTAS__TCSWMOO",
                                "TAW__LISTAS__TCSBCANT",
                                "TAW__LISTAS__TCS4PAT",
                                "TAW__LISTAS__TCSBCANT",
                                "TAW__LISTAS__TCS0553",
                                "TAW__LISTAS__TCSELEM",
                                "TAW__LISTAS__TCSRAP",
                                "TAW__LISTAS__TCSREX"];
                                
    private static AW_VARCOND_NAMES = [...BasketUI.AW_TAPICERIA, ...BasketUI.AW_TACOS];

////////////////////////                         ////////////////////////
    private async getVariantCodeForPrices(article: cf.ArticleElement, propNames: string[]): Promise<string | null> {
        try {         
            const data = await article.getArticleData();
            const properties = data?.properties;
            
        
            if (!properties || properties.length === 0) {
                console.warn(`[File: ${import.meta.url}] [Method: getVariantCodeForPrices] No properties found`);
                return null;
            }
    
            const filteredProperties = properties.filter(prop => propNames.includes(prop.propName));
    
       // console.log("filteredProperties", filteredProperties);  

        
            if (filteredProperties.length === 0) {
                console.warn(`[File: ${import.meta.url}] [Method: getVariantCodeForPrices] No matching properties found`);
                return null;
            }

            const formattedProperties = filteredProperties
                .map(prop => `${prop.propClass}.${prop.propName}=${prop.value?.value ?? "N/A"}`) //N/A???
                .join(';');
        
            return formattedProperties;
          
        } catch (error) {
            console.error(`[File: ${import.meta.url}] [Method: getVariantCodeForPrices] Error:`, error);
            return null;
        }
    } 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
// 


    /**
     * Gets articles items from basket service and displays them.
     */
    public async updateBasket(): Promise<void> {
        this.clearHtmlContainer();
        // create new basket html elements
        const mainArticles: Array<cf.MainArticleElement> = this.articleManager.getAllMainArticles();
        for (const mainArticle of mainArticles) {
            this.htmlContainer.append(await this.createBasketItem(mainArticle));
        }
    }

    private clearHtmlContainer(): void {
        while (this.htmlContainer.lastChild) {
            this.htmlContainer.removeChild(this.htmlContainer.lastChild);
        }
    }

     /**
     * Creates a html element for a basket article and its sub articles.
     */
    private async createBasketItem(article: cf.ArticleElement): Promise<HTMLElement> {
        const item: HTMLDivElement = document.createElement('div');
        item.onclick = this.onItemClicked.bind(this, article);
        item.className = 'basket-item';
        const itemProperties: basket.ItemProperties = await article.getItemProperties();
        if (itemProperties.article != null) {
 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////     
    const itemData: basket.ArticleData   = await article.getArticleData();
    const filteredProperties = await this.getVariantCodeForPrices(article, BasketUI.AW_VARCOND_NAMES) ?? "";
    const newVariantCode = await AWVariantCodeUtils.createFromArticle(article);
    const baseArticleNumber = itemData?.baseArticleNumber;
   
    const priceResponse = await this.priceService.fetchPrice(baseArticleNumber, newVariantCode);
    const price = priceResponse?.price ?? "Price not available";
    item.innerHTML = `
    <div> <h1> Price: ${price} </h1></div>
    <div> Modified Variant Code</div>
    <div class="newVariantCode">${newVariantCode}</div>

    <div>
    <button class="copy-button" onclick="navigator.clipboard.writeText('${newVariantCode}')">Copiar Variant Code</button></div>
    <div>Filtered Properties for quoter</div>
    <div class="newVariantCode">${filteredProperties}</div>
    <button class="copy-button" onclick="navigator.clipboard.writeText('${filteredProperties}')">Copiar filtered props</button></div>
    `;
 

        }
 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 

        // sub articles
        const subArticles: Array<cf.SubArticleElement> = article.getSubArticles(false);
        if (subArticles.length > 0) {
            const subItems: HTMLDivElement = document.createElement('div');
            subItems.className = 'basket-sub-items';
            item.appendChild(subItems);
            for (const subArticle of subArticles) {
                subItems.appendChild(await this.createBasketItem(subArticle));
            }
        }

        // handle migration of older articles (.obk, .pec)
        if (article instanceof cf.MainArticleElement) {
            const ofmlState: basket.OFMLUpdateState = await article.getOfmlUpdateState();
            item.dataset.updateState = ofmlState;
            if (ofmlState === 'Migratable' || ofmlState === 'Updatable') {
                const migrationButton: HTMLButtonElement = document.createElement('button');
                migrationButton.innerText = ofmlState === 'Migratable' ? 'Migrate article' : 'Update article';
                migrationButton.onclick = async () => {
                    ProgressUI.beginLoading();
                    await article.updateOfmlArticle(true, true);
                    ProgressUI.endLoading();
                };
                item.appendChild(migrationButton);
            }
        }
        return item;
    }


    
}



     
   
 