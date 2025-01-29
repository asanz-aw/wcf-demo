import * as eaiws from '@easterngraphics/wcf/modules/eaiws';
import * as core from '@easterngraphics/wcf/modules/core';
import * as cf from '@easterngraphics/wcf/modules/cf';
import * as catalog from '@easterngraphics/wcf/modules/eaiws/catalog';
import { InsertElements } from '@easterngraphics/wcf/modules/core/cmd';
import { importPec, importPecFromCatalog } from '@easterngraphics/wcf/modules/cf/io';
import { Log, wcfConfig } from "@easterngraphics/wcf/modules/utils";
import { getFilePath, getUrlParamValue, isNotNullOrEmpty, isNullOrEmpty } from "@easterngraphics/wcf/modules/utils/string";
import { ajax } from "@easterngraphics/wcf/modules/utils/async";
import "@easterngraphics/wcf/modules/polyfill/core-js";



import { Engine } from "@babylonjs/core";

import { CatalogUI } from './components/catalog';
import { BasketUI } from './components/basket';
import { PropertyEditorUI } from './components/property-editor';
import { ViewerUI } from './components/viewer';
import { OapUI } from './components/oap';
import { ExportUI } from './components/export';
import { PersistenceUI } from './components/persistence';
import { ProgressUI } from './components/progress';
import './index.css';
import { HtmlUtils, isIOSBrowser } from './utils';
import { SceneElement } from '@easterngraphics/wcf/modules/core/mdl';
export class App {
    private readonly DEFAULT_GATEKEEPER_ID: string = '5a969885660e5';
    private gatekeeperId: string | undefined;
    private session: eaiws.EaiwsSession;
    private basketUI: BasketUI;
    private viewerUI: ViewerUI;
    private coreApp: core.Application;
    private articleManager: cf.ArticleManager;
    private catalogUI: CatalogUI;
    private propertyEditorUI: PropertyEditorUI;
    private oapUI: OapUI;
    private exportUI: ExportUI;
    private persistenceUI: PersistenceUI;
    constructor() {
        void this.init();
    }

    public async init(): Promise<void> {
        if (!Engine.isSupported()) {
            alert('WebGL required!');
            return;
        }
        // enable hover effects for icons (like oap-interactors)
        if (!isIOSBrowser() && document.documentElement != null) { // on ios this leads to click icons twice, so we don't add it here
            document.documentElement.classList.add("wcf-hover-enabled");
        }
        // setup w-cf
        ProgressUI.beginLoading();
        this.session = await this.createSession();

        // setup languages (if first language is not available, the second will be used and so on)
        await this.session.catalog.setLanguages(['en', 'de', 'fr']);
        await this.session.basket.setLanguages(['en', 'de', 'fr']);

        // setup core
        this.coreApp = new core.Application();
        this.coreApp.applicationName = "WCF-DEV-EXAMPLE";
        this.coreApp.applicationVersion = "1.0.0";
        const rootPath: string = getFilePath(window.location.pathname);
        wcfConfig.dataPath = rootPath + 'w-cf/data/';
        const appOptions: Partial<core.AppInitOptions> = {};
        this.coreApp.initialize(document.getElementById('viewer') as HTMLDivElement, appOptions);
        Log.info("W-CF " + this.coreApp.version + " build: " + this.coreApp.buildInfo);

        this.articleManager = new cf.ArticleManager(this.coreApp, this.session, { oapPlanningMode: false });
        this.articleManager.setGfjBasketIdsEnabled(true);

        // add all ui components
        this.viewerUI = new ViewerUI(
            this.coreApp,
            {
                disableCameraPanning: false,
                limitCameraDistanceByElementRadius: false
            }
        );
        this.catalogUI = new CatalogUI(
            HtmlUtils.getNotNullElementById('catalog'),
            this.session.catalog,
            this.onInsertCatalogArticle.bind(this),
            this.onInsertCatalogContainer.bind(this),
            this.articleManager
        );
        this.propertyEditorUI = new PropertyEditorUI(
            HtmlUtils.getNotNullElementById('property-editor'),
            this.coreApp.model.selectionProperties
        );
        this.oapUI = new OapUI(
            HtmlUtils.getNotNullElementById('oap'),
            this.coreApp.model.selectionProperties,
            this.coreApp.appCallbacks
        );
        this.basketUI = new BasketUI(
            HtmlUtils.getNotNullElementById('basket'),
            this.articleManager,
            this.onBasketItemClicked.bind(this)
        );
        this.exportUI = new ExportUI(
            HtmlUtils.getNotNullElementById('export'),
            this.articleManager,
            this.coreApp.viewer
        );
        this.persistenceUI = new PersistenceUI(
            HtmlUtils.getNotNullElementById('persistence'),
            this.articleManager,
            this.onLoadFile.bind(this)
        );
        if (this.gatekeeperId === this.DEFAULT_GATEKEEPER_ID) {
            await this.insertInitialArticle();
        }
        ProgressUI.endLoading();
    }

    /**
     * Creates a session using gatekeeper id or a direct connection to eaiws via baseurl and startup.
     * To use a direct connection to eaiws, just set the search parameters baseurl and startup like:
     * http://localhost:3000/?baseurl=https://my-eaiws-server/&startup=my_startup
     */
    private async createSession(): Promise<eaiws.EaiwsSession> {
        const baseUrl = getUrlParamValue(window.location.href, 'baseurl');
        const startup = getUrlParamValue(window.location.href, 'startup');
        const useStartup = isNotNullOrEmpty(baseUrl) && isNotNullOrEmpty(startup);
        if (useStartup) {
            return this.createSessionWithStartup(baseUrl, startup);
        }
        this.gatekeeperId = this.getFromUrlOrPrompt('gatekeeper_id', this.DEFAULT_GATEKEEPER_ID);
        return this.createSessionWithGatekeeperId(this.gatekeeperId);
    }

    /**
     * Creates a direct connection to eaiws with a baseurl and startup.
     */
    private async createSessionWithStartup(baseUrl: string, startup: string): Promise<eaiws.EaiwsSession> {
        if (isNullOrEmpty(baseUrl)) {
            throw new Error('baseurl missing');
        }
        if (isNullOrEmpty(startup)) {
            throw new Error('startup missing');
        }
        const session = new eaiws.EaiwsSession();
        await session.open(baseUrl, { startup: startup });
        return session;
    }

    /**
     * Create session with gatekeeper, details here: https://eaiws-server.pcon-solutions.com/doc/v3/
     */
    private async createSessionWithGatekeeperId(gatekeeperId: string): Promise<eaiws.EaiwsSession> {
        let gatekeeperResponse: { keepAliveInterval: number, server: string, sessionId: string };
        const locale = 'de_DE'; // enter here the users locale (i.e. from the browser) to support special character handling. More infos see https://eaiws-server.pcon-solutions.com/doc/v3/#tag/Session/paths/~1session~1{id}/post
        try {
            gatekeeperResponse =
                await ajax(
                    'POST',
                    'https://eaiws-server.pcon-solutions.com/v3/session/' + gatekeeperId,
                    {
                        locale,
                    },
                    {
                        dataType: 'json',
                        retryAttempts: 1,
                        ignoreGlobalErrorHandler: true,
                        timeout: 10000,
                    }
                );
        } catch (error) {
            Log.info('Failed to start gatekeeper session, using fallback server: ' + (error as string));
            gatekeeperResponse = await ajax(
                'POST',
                'https://eaiws-server-fallback.pcon-solutions.com/v3/session/' + gatekeeperId,
                {
                    locale,
                },
                {
                    dataType: 'json',
                }
            );
        }
        const session = new eaiws.EaiwsSession();
        session.connect(
            gatekeeperResponse.server,
            gatekeeperResponse.sessionId,
            gatekeeperResponse.keepAliveInterval * 1000 // keep alive is given in seconds
        );
        return session;
    }

    private getFromUrlOrPrompt(urlParam: string): string | undefined;
    private getFromUrlOrPrompt(urlParam: string, defaultValue: string): string;
    private getFromUrlOrPrompt(urlParam: string, defaultValue?: string): string | undefined {
        const fromUrl: string | null = getUrlParamValue(window.location.href, urlParam);
        if (isNotNullOrEmpty(fromUrl)) {
            return fromUrl;
        }
        const fromPrompt = prompt(`please enter ${urlParam}:`, defaultValue);
        if (isNotNullOrEmpty(fromPrompt)) {
            return fromPrompt;
        }
        return defaultValue;
    }

    private async onInsertCatalogArticle(article: catalog.ArticleCatalogItem): Promise<void> {
        console.log('App::onInsertCatalogArticle', article);
        ProgressUI.beginLoading();
        await this.removeAllElements();

        const element: cf.MainArticleElement = await this.articleManager.insertArticle(article);
        this.coreApp.model.addElement(element); // we need to add it also to the model manager, or we wont see the new article
        this.coreApp.model.setSelection([element]);
        this.viewerUI.resetCamera();
        this.viewerUI.allowMainArticleSelection(this.coreApp.model.elements.length > 1);
        await this.basketUI.updateBasket();
        ProgressUI.endLoading();
    }

    private async onInsertCatalogContainer(container: catalog.CatalogItem): Promise<void> {
        console.log('App::onInsertCatalogContainer', container);
        ProgressUI.beginLoading();
        await this.removeAllElements();

        const elements: Array<SceneElement> = await importPecFromCatalog(this.articleManager, container);
        elements.forEach((element) => this.coreApp.model.addElement(element));

        this.viewerUI.resetCamera();
        this.viewerUI.allowMainArticleSelection(this.coreApp.model.elements.length > 1);
        await this.basketUI.updateBasket();
        ProgressUI.endLoading();
    }

    private async removeAllElements(): Promise<void> {
        while (this.coreApp.model.elements.length > 0) {
            this.coreApp.model.removeElement(this.coreApp.model.elements[0]);
        }
        await this.articleManager.synchronizeSession(false); // we need to tell the server, that we deleted items
    }

    /**
     * Select article item if it was clicked in the basket.
     */
    private onBasketItemClicked(item: cf.ArticleElement, event: MouseEvent): void {
        console.log('App::onBasketItemClicked', item);
        event.stopImmediatePropagation();
        if (item instanceof cf.MainArticleElement) {
            this.coreApp.model.setSelection([item]);
        } else if (item instanceof cf.SubArticleElement) {
            this.coreApp.model.setSubElementSelection(item.getMainArticle(), item);
        }
    }

    /**
     * Loads an old planning.
     * @param file Loaded .obk/.pec file as binary
     */
    private async onLoadFile(file: Blob, fileType: 'obk' | 'pec'): Promise<void> {
        ProgressUI.beginLoading();
        this.coreApp.document.clear(); // removes everything from the scene, so we can start from scratch
        if (fileType === 'obk') {
            const url: string | null = await this.articleManager.session.uploadFile('Project', file);
            if (isNullOrEmpty(url)) {
                alert('failed to upload file');
                return;
            }
            await this.session.session.loadSession(url);
            await this.session.deleteFile(url); // we don't need the file anymore
            await this.articleManager.importFromSession({ importArticlesWithoutPosition: true });
        } else if (fileType === 'pec') {
            try {
                const elements: Array<SceneElement> = await importPec(this.articleManager, file);
                const insertCommand: InsertElements = new InsertElements(this.coreApp, elements);
                await this.coreApp.commands.executeCommand(insertCommand);
            } catch (e) {
                console.error('failed to load pec', e);
            }
        }
        this.viewerUI.resetCamera();
        await this.basketUI.updateBasket();
        if (this.coreApp.model.elements.length > 0) {
            this.coreApp.model.setSelection([this.coreApp.model.elements[0]]);
        }
        this.viewerUI.allowMainArticleSelection(this.coreApp.model.elements.length > 1);
        ProgressUI.endLoading();
    }

    /**
     * Example for inserting a specific configuration of an article.
     *
     * The key to get a specific configuration is the variant code.
     * He can be received by getArticleData() (i.e. type in console: (await app.coreApp.model.selection[0].getArticleData()).variantCode).
     * So you could configure an article as you want, get its variant code and insert him here.
     *
     * If you want to insert a more complex article with sub articles, you could save an .obk and load it on startup.
     */
    private async insertInitialArticle(): Promise<void> {
        const searchParameterSet: catalog.SearchArticleParameterSet = new catalog.SearchArticleParameterSet();
        searchParameterSet.catalogIds = ['egroffice:0'];
        searchParameterSet.baseArticleNumber = '4520';
        searchParameterSet.numberOfHits = 1;
        const lookupOptions: catalog.LookupOptions = new catalog.LookupOptions();
        lookupOptions.displayMode = 'All';
        const foundItems: catalog.TopCatalogItems | undefined = await this.session.catalog.searchArticle(searchParameterSet, lookupOptions);
        const item: catalog.CatalogItem | undefined = foundItems?.scoredItems[0]?.item;
        if (item instanceof catalog.ArticleCatalogItem) {
            // to insert a specific variant, we set the variant code here
            item.varCodeType = 'OFML';
            item.variantCode = 'Polster.Ausf=13;Armlehne.Visible=1;Gestell.FootMat=82';
            await this.onInsertCatalogArticle(item);
        } else {
            alert('Article could not be found.');
        }
    }
    /**
     * This shows how to insert initially a .pec container.
     */
    private async insertInitialContainer(): Promise<void> {
        const searchParameterSet: catalog.SearchResourceParameterSet = new catalog.SearchResourceParameterSet();
        searchParameterSet.catalogIds = ['egroffice:0'];
        searchParameterSet.resourceType = 'XCF:PEC';
        searchParameterSet.numberOfHits = 1;
        searchParameterSet.value = 'pec name'; // will not be found because in test data is currently no pec container

        const lookupOptions: catalog.LookupOptions = new catalog.LookupOptions();
        lookupOptions.itemTypes = ['Container'];
        lookupOptions.displayMode = 'All';
        const foundItems: catalog.TopCatalogItems | undefined = await this.session.catalog.searchResource(searchParameterSet, lookupOptions);
        const item: catalog.CatalogItem | undefined = foundItems?.scoredItems[0]?.item;
        if (item != null) {
            await this.onInsertCatalogContainer(item);
        } else {
            alert('Pec container could not be found.');
        }
    }
}
window.app = new App(); // make app accessible in console for debug/testing, just type "app" in the browser console