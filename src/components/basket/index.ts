import * as cf from '@easterngraphics/wcf/modules/cf';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket';
import { ProgressUI } from '../progress';
import './index.css';
import  AWVariantCodeUtils  from './AWVariantCodeUtils';


/**
 * Shows commercial information about the current articles in the scene, like article number, price, sub articles etc.
 */
export class BasketUI {
    private articleManager: cf.ArticleManager;
    private onItemClicked: (item: cf.ArticleElement, event: MouseEvent) => void; // callback if user clicks on a basket item
    private htmlContainer: HTMLElement;
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


     public async createAWVariantCode(article:cf.ArticleElement) {

        const itemProperties: basket.ItemProperties = await article.getItemProperties();
        const itemData: basket.ArticleData   = await article.getArticleData();

        var allVariantProperties: string[] = [];
        if (itemProperties.article?.variantCode) {
            allVariantProperties = itemProperties.article.variantCode.split(';');               
        }

        const itemDataVariantArray = itemData.properties?.map(prop => `${prop.propClass.replace(/__/g, '_')}.${prop.propName.replace(/__/g, '_')}=${prop.value.value}`) ?? [];      
        const uniqueVariantProperties= Array.from(new Set([...allVariantProperties, ...itemDataVariantArray]));

        const allValuesString = uniqueVariantProperties.join(';');
        console.log(allValuesString);

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
       
       const newVariantCode = await AWVariantCodeUtils.createFromArticle(article);
        
        item.innerHTML = `
        <div class="newVariantCode">${newVariantCode}</div>
        <div>
        <button class="copy-button" onclick="navigator.clipboard.writeText('${newVariantCode}')">Copiar Variant Code</button></div>
        `;

        }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//recorrer todas las propiedades 


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


