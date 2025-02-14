import * as catalog from '@easterngraphics/wcf/modules/eaiws/catalog';
import { HtmlUtils } from '../../utils';
import './index.css';
import * as cf from '@easterngraphics/wcf/modules/cf';
import * as basket from '@easterngraphics/wcf/modules/eaiws/basket';
import AWVariantCodeUtils from '../basket/AWVariantCodeUtils';
import { AWPriceService } from '../basket/AWPriceService';
import {
  MultiPropertyProvider,
  Property,
  PropertyChangedResult,
  PropertyClass,
  PropertyValue,
  groupProperties
} from '@easterngraphics/wcf/modules/core/prop';
import { AppSettings } from '@easterngraphics/wcf/modules/core';
import { PriceComparator } from './PriceComparator';

/**
 * Interface for collecting price error details.
 */
export interface PriceError {
  sku: string;
  variantCode: string;
  price: string;
  sapPrice: string;
}

/**
 * UI for navigating a catalog and testing product pricing.
 */
export class CatalogUI {
  // Catalog & UI state
  private catalogService: catalog.CatalogService;
  private catalogPath: string[] = [];
  private onInsertArticle: (item: catalog.ArticleCatalogItem) => Promise<void>;
  private onInsertContainer: (item: catalog.CatalogItem) => Promise<void>;
  private showingSearchResults = false;

  // Article & DOM references
  private articleManager: cf.ArticleManager;
  private htmlContainer: HTMLElement;
  private htmlContainerTestResults: HTMLElement;
  private htmlContainerTestResultsSummary: HTMLElement;
  private itemsContainer: HTMLElement;
  private searchBar: HTMLDivElement;
  private readonly lookupOptions: catalog.LookupOptions;
  private pricesTable: HTMLTableElement;

  // Services
  private priceService: AWPriceService = new AWPriceService();

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
    this.onInsertArticle = onInsertArticle;
    this.onInsertContainer = onInsertContainer;
    this.articleManager = articleManager;
    this.htmlContainer = htmlContainer;
    this.htmlContainerTestResults = htmlContainerTestResults;
    this.htmlContainerTestResultsSummary = htmlContainerTestResultsSummary;

    // Setup lookup options for catalog service
    this.lookupOptions = new catalog.LookupOptions();
    this.lookupOptions.itemTypes = ['Article', 'Folder', 'Container', 'Information'];
    this.lookupOptions.displayMode = 'AllVisible';

    // Build initial UI
    this.searchBar = this.htmlContainer.appendChild(this.createSearchBar());
    this.itemsContainer = document.createElement('div');
    this.itemsContainer.className = 'catalog-items';
    this.htmlContainer.appendChild(this.itemsContainer);
    this.createCatalogItems();
  }

  // ─────────────────────────────────────────────────────────────
  // UI Creation Methods
  // ─────────────────────────────────────────────────────────────

  private createSearchBar(): HTMLDivElement {
    const searchBar = document.createElement('div');
    searchBar.className = 'catalog-search';

    const input = document.createElement('input');
    input.className = 'catalog-search-input';
    searchBar.appendChild(input);

    const submit = document.createElement('button');
    submit.innerText = "Test 'em all!!!";
    submit.onclick = () => this.onSearchCatalogClick(input);
    searchBar.appendChild(submit);

    return searchBar;
  }

  private createCatalogItems(): void {
    // Show search bar only when catalog path is set
    this.searchBar.style.display = this.catalogPath.length === 0 ? 'none' : 'block';
    HtmlUtils.removeAllChildren(this.itemsContainer);

    this.catalogService
      .listCatalogItems(this.catalogPath, this.lookupOptions)
      .then((catalogItems) => {
        if (this.catalogPath.length > 0) {
          this.itemsContainer.appendChild(this.createBackButton());
        }
        catalogItems.forEach((item) => this.itemsContainer.appendChild(this.createCatalogItem(item)));
      });
  }

  private createBackButton(): HTMLElement {
    const backButton = document.createElement('div');
    backButton.className = 'catalog-item folder';
    backButton.onclick = () => this.onBackClick();
    backButton.innerHTML = `<div class="catalog-item-label">back</div>`;
    return backButton;
  }

  private createCatalogItem(catalogItem: catalog.CatalogItem): HTMLElement {
    const itemEl = document.createElement('div');
    itemEl.className = `catalog-item ${catalogItem.type === 'Folder' ? 'folder' : ''}`;
    itemEl.onclick = () => this.onItemClick(catalogItem);
    itemEl.innerHTML = `
      <img class="catalog-item-icon" src="${catalogItem.icon}" />
      <div class="catalog-item-label">${catalogItem.label}</div>
    `;
    return itemEl;
  }

  private createPricesTable(): HTMLTableElement {
    const table = document.createElement("table");
    table.className = "prices-table";

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

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    return table;
  }

  private addPriceRow(
    table: HTMLTableElement,
    sku: string,
    variantCode: string,
    price: string,
    sapPrice: string,
    isEqual: string
  ): void {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const row = document.createElement("tr");
    [sku, variantCode, price, sapPrice, isEqual].forEach((text) => {
      const cell = document.createElement("td");
      cell.innerText = text;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }

  private createCopyButton(copyType: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerText = "Copy Results";
    button.onclick = () => this.copyTableToClipboard(copyType);
    return button;
  }

  private copyTableToClipboard(copyType: boolean): void {
    const selector = copyType ? ".resultados" : ".prices-table";
    const table = this.htmlContainerTestResults.querySelector(selector);
    const tableHtml = table?.outerHTML || '';
    navigator.clipboard.writeText(tableHtml).catch(err => {
      console.error("Failed to copy table: ", err);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────

  private async onSearchCatalogClick(inputField: HTMLInputElement): Promise<void> {
    const query = inputField.value?.trim();
    if (!query) return;

    // Clear previous test results
    HtmlUtils.removeAllChildren(this.htmlContainerTestResults);
    HtmlUtils.removeAllChildren(this.htmlContainerTestResultsSummary);

    // Add copy buttons
    const copyButton = this.createCopyButton(false);
    const copyButtonSummary = this.createCopyButton(true);
    this.htmlContainerTestResults.appendChild(copyButton);
    this.htmlContainerTestResultsSummary.appendChild(copyButtonSummary);

    // Process one or more SKUs (comma separated)
    const skus = query.toUpperCase().split(',');
    this.pricesTable = this.createPricesTable();
    for (const sku of skus) {
      const trimmedSku = sku.trim();
      if (!trimmedSku) continue;

      if (trimmedSku.startsWith('M')) {
        await this.testTopProducts(trimmedSku);
      } else if (trimmedSku.startsWith('CZ')) {
        await this.testTopCredenzaProducts(trimmedSku);
      } else {
        await this.getOneProduct(trimmedSku);
      }
    }
  }

  private async onBackClick(): Promise<void> {
    if (this.showingSearchResults) {
      this.showingSearchResults = false;
    } else {
      this.catalogPath.pop();
    }
    this.createCatalogItems();
  }

  private async onItemClick(item: catalog.CatalogItem): Promise<void> {
    switch (item.type) {
      case 'Article':
        if (item instanceof catalog.ArticleCatalogItem) {
          await this.onInsertArticle(item);
          // Optionally: this.playWithCatalogItem(item);
        }
        break;
      case 'Container':
        await this.onInsertContainer(item);
        break;
      case 'Information':
        this.downloadPDF(item);
        break;
      case 'Folder':
        if (this.showingSearchResults) {
          this.catalogPath = await this.catalogService.getCatalogPath(item.catalogId, item.catalogNodeKey);
          this.showingSearchResults = false;
        } else {
          this.catalogPath.push(item.name);
        }
        this.createCatalogItems();
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Catalog / Article Helpers
  // ─────────────────────────────────────────────────────────────

  private downloadPDF(item: catalog.CatalogItem): void {
    if (item.resources) {
      for (const resource of item.resources) {
        const value = resource.value;
        if (value && value.startsWith('application/pdf')) {
          const url = value.substring(value.indexOf(';') + 1);
          window.location.href = url;
          break;
        }
      }
    }
  }

  private async searchCatalogItems(sku: string): Promise<catalog.TopCatalogItems | undefined> {
    const parameterSet = new catalog.SearchParameterSet();
    parameterSet.catalogIds = [this.catalogPath[0]];
    parameterSet.query = sku;
    parameterSet.numberOfHits = 100;
    parameterSet.flags = ["FolderText"];
    console.log(parameterSet);
    return await this.catalogService.searchCatalogItems(parameterSet, this.lookupOptions);
  }

  private async testTopProducts(sku: string): Promise<void> {
    console.log("Testing top products for SKU:", sku);
    const foundItems = await this.searchCatalogItems(sku);
    if (!foundItems) return;
    
    for (const scoredItem of foundItems.scoredItems) {
      const item = scoredItem.item;
      
      if (item instanceof catalog.ArticleCatalogItem) {
        const element = await this.articleManager.insertArticle(item) as cf.MainArticleElement;
        const articleProperties = await element.getProperties();
        if (!articleProperties) continue;

        const formaProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWFORMA__SOBRE");
        if (!formaProperty) {
          const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
          await this.getPricesAndCompare(sku, newVariantCode, "0");
          continue;
        }



        const formaChoices = await formaProperty.getChoices();
        if (!formaChoices) continue;

        for (const formaChoice of formaChoices) {
          await formaProperty.setValue(formaChoice.value);
          const tipoSobreProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWTIPO__SOBRE");

          if (tipoSobreProperty) {
            const tipoSobreChoices = await tipoSobreProperty.getChoices();
            if (tipoSobreChoices) {
              for (const tipoSobreChoice of tipoSobreChoices) {
                await tipoSobreProperty.setValue(tipoSobreChoice.value);
                const tipoSobreInfProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWTIPO__SOBRE__INFERIOR");
                if (tipoSobreInfProperty) {
                  console.log("RUTA TABLE --------------------");
                  const tipoSobreInfChoices = await tipoSobreInfProperty.getChoices();
                  if (tipoSobreInfChoices) {
                    for (const tipoSobreInfChoice of tipoSobreInfChoices) {
                      await tipoSobreInfProperty.setValue(tipoSobreInfChoice.value);
                      const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
                      const awsSeriesMesas = newVariantCode
                        .split(';')
                        .find(part => part.includes('AWSERIES_MESAS'));
                      const awsSeriesMesasValue = awsSeriesMesas ? awsSeriesMesas.split('=')[1] : 'N/A';
                      await this.getPricesAndCompare(sku, newVariantCode, awsSeriesMesasValue);
                    }
                  }
                } else {
                  const coleccionTopProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWCOLECCION__TOP");
                  if (coleccionTopProperty) {
                    console.log("MESA cafe --------------------");
                    const colleccionTopChoices = await coleccionTopProperty.getChoices();
                    if (colleccionTopChoices) {
                      for (const colleccionTopChoice of colleccionTopChoices) {
                        await coleccionTopProperty.setValue(colleccionTopChoice.value);
                        const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
                        const awsSeriesMesas = newVariantCode
                          .split(';')
                          .find(part => part.includes('AWSERIE_CAFE'));
                        const awsSeriesMesasCafeValue = awsSeriesMesas ? awsSeriesMesas.split('=')[1] : 'N/A';
                        await this.getPricesAndCompare(sku, newVariantCode, awsSeriesMesasCafeValue);
                      }
                    }
                  } else {
                    console.log("MESA CONFigurable --------------------");
                    // Mesa normal
                    const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
                    const awsSeriesMesas = newVariantCode
                      .split(';')
                      .find(part => part.includes('AWSERIES_MESAS'));
                    const awsSeriesMesasConfValue = awsSeriesMesas ? awsSeriesMesas.split('=')[1] : 'N/A';
                    await this.getPricesAndCompare(sku, newVariantCode, awsSeriesMesasConfValue);
                  }
                }
              }
            }
          } else {
            await this.testTopCredenzaProducts(sku); // credenza?
          }
        }
      }
    }
  }

  private async getPricesAndCompare(sku: string, newVariantCode: string, serie: string): Promise<void> {
    if (serie === 'N/A') {
      console.log("No serie found for SKU:", sku);
    } else {
      const response = await fetch(`http://localhost:13000/precio/${sku}?serie=${serie}`);
      const data = await response.json();
      console.log(`http://localhost:13000/precio/${sku}?serie=${serie}`);
      // Assume price comes in the 'precio' property of the first record
      const priceSAP: string | number = data[0]?.precio ?? "Price not available";

      // Get price from the price service
      const priceServiceResponse = await this.priceService.fetchPrice(sku, newVariantCode);
      const priceServicePrice: string | number = priceServiceResponse?.price ?? "Price not available";

      // Compare prices
      try {
        const areEqual = PriceComparator.comparePrices(priceSAP, priceServicePrice);
        const symbol = PriceComparator.comparePricesSymbol(priceSAP, priceServicePrice);
        console.log(`SKU: ${sku}, Serie: ${serie}, Price: ${priceServicePrice}, SAP Price: ${priceSAP}, Equal: ${symbol}`);
      } catch (error) {
        console.error("Error comparing prices:", error);
      }
    }
  }

  private async printAllProperties(foundItems: catalog.TopCatalogItems | undefined): Promise<void> {
    if (foundItems) {
      for (const scoredItem of foundItems.scoredItems) {
        const item = scoredItem.item;
        if (item instanceof catalog.ArticleCatalogItem) {
          const element: cf.MainArticleElement = await this.articleManager.insertArticle(item);
          const articleProperties = await element.getProperties();
          if (articleProperties) {
            for (const property of articleProperties) {
              console.log(property);
            }
          }
        }
      }
    }
  }

  private async testTopCredenzaProducts(sku: string): Promise<void> {
    const foundItems = await this.searchCatalogItems(sku);
  
    if (!foundItems) return;

    for (const scoredItem of foundItems.scoredItems) {
      const item = scoredItem.item;
      if (item instanceof catalog.ArticleCatalogItem) {
        const element = await this.articleManager.insertArticle(item) as cf.MainArticleElement;
        const articleProperties = await element.getProperties();
        if (!articleProperties) continue;
        const credenzaMatExtProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWTIPO__MAT__EXT");
        if (credenzaMatExtProperty) {
          console.log("Credenza --------------------");
          const matExtChoices = await credenzaMatExtProperty.getChoices();
          console.log(matExtChoices);
          if (matExtChoices) {
            for (const matExtChoice of matExtChoices) {
              await credenzaMatExtProperty.setValue(matExtChoice.value);
              const tempoSobreProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWTIPO__TOP");
              if (tempoSobreProperty) { // Tempo credenza
                const tipoSobreChoices = await tempoSobreProperty.getChoices();
                console.log(tipoSobreChoices);
                if (tipoSobreChoices) {
                  for (const tipoSobreChoice of tipoSobreChoices) {
                    await tempoSobreProperty.setValue(tipoSobreChoice.value);
                    const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
                    const awsSeriesTempoCredenza = newVariantCode
                      .split(';')
                      .find(part => part.includes('AWSERIE_MESAS'));
                    const awsSeriesTempoCredenzaValue = awsSeriesTempoCredenza ? awsSeriesTempoCredenza.split('=')[1] : 'N/A';
                    await this.getPricesAndCompare(sku, newVariantCode, awsSeriesTempoCredenzaValue);
                    console.log(awsSeriesTempoCredenzaValue);
                    console.log(newVariantCode);
                  }
                }
              } else {
                const elementMatIntProperty = articleProperties.find(prop => prop.key === "[Character]AWD_AWTIPO__MAT__INT__P");
                const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
                if (elementMatIntProperty) {
                  // Handle element credenza if needed
                }
              }
            }
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Price Processing Methods
  // ─────────────────────────────────────────────────────────────

  private async fetchPriceData(sku: string): Promise<any> {
    const response = await fetch(`http://localhost:13000/precio/${sku}`);
    return await response.json();
  }

  private async processVariant(
    element: cf.MainArticleElement,
    sku: string,
    priceData: any,
    prefix_SERIE_TAP: string,
    priceErrors: PriceError[],
    counters: { matches: number; discrepancies: number }
  ): Promise<void> {
    const newVariantCode = await AWVariantCodeUtils.createFromArticle(element);
    const priceResponse = await this.priceService.fetchPrice(sku, newVariantCode);
    const price = priceResponse?.price ?? "Price not available";

    const variantCodeParts = newVariantCode.split(";");
    let serieValue =
      variantCodeParts.find((part) => part.includes(prefix_SERIE_TAP))?.split("=")[1] ?? "N/A";
    if (serieValue === "N/A") {
      serieValue =
        variantCodeParts.find((part) => part.includes("AWSERIE"))?.split("=")[1] ?? "N/A";
    }

    let priceFromData =
      priceData.find((data: any) => data[serieValue] !== undefined)?.[serieValue] ?? "SAP not available";

    if (priceFromData !== "SAP not available") {
      if (priceFromData.toString().includes(".")) {
        const parts = priceFromData.toString().split(".");
        parts[1] = parts[1].padEnd(3, "0");
        priceFromData = parts.join(".") + ",00€";
      } else {
        priceFromData += ",00€";
      }
    }

    const isEqual = price.toString() === priceFromData.toString() ? "✅" : "❌";
    if (isEqual === "❌") {
      priceErrors.push({
        sku,
        variantCode: newVariantCode,
        price: price.toString(),
        sapPrice: priceFromData,
      });
      console.log(
        `SKU: ${sku} - Serie Value: ${serieValue} - Price: ${price.toString()} - SAP Price: ${priceFromData}`
      );
      console.log(`Variant Code: ${newVariantCode}`);
    }

    this.addPriceRow(this.pricesTable, sku, serieValue, price.toString(), priceFromData, isEqual);

    if (isEqual === "✅") {
      counters.matches++;
    } else {
      counters.discrepancies++;
    }
  }

  private async processPropertyVariants(
    element: cf.MainArticleElement,
    sku: string,
    AWD_TAPICERIA: string,
    AWD_SERIE_TAPICERIA: string,
    prefix_SERIE_TAP: string,
    priceData: any,
    priceErrors: PriceError[],
    counters: { matches: number; discrepancies: number }
  ): Promise<void> {
    const articleProperties = await element.getProperties();
    if (!articleProperties) return;

    for (const property of articleProperties) {
      if (property.key === AWD_TAPICERIA || property.key === AWD_SERIE_TAPICERIA) {
        const choices = await property.getChoices();
        if (choices && choices.length > 0) {
          const startIndex = choices.length === 2 ? 1 : 0;
          for (let i = startIndex; i < choices.length; i++) {
            await property.setValue(choices[i].value);
            if (choices[i].value === "STAP") {
              await this.processVariant(element, sku, priceData, prefix_SERIE_TAP, priceErrors, counters);
            }

            const propsAfterOption = await element.getProperties();
            if (!propsAfterOption) continue;
            const materialProperty = propsAfterOption.find(
              (prop) =>
                prop.key.startsWith("[Character]AWD_LISTAS") &&
                prop.key.endsWith("TAPICERIA")
            );
            if (materialProperty) {
              const materialChoices = await materialProperty.getChoices();
              if (materialChoices && materialChoices.length > 0) {
                for (const material of materialChoices) {
                  await materialProperty.setValue(material.value);
                  const propsAfterMaterial = await element.getProperties();
                  if (!propsAfterMaterial) continue;
                  const serieProperty = propsAfterMaterial.find(
                    (prop) =>
                      prop.key.startsWith("[Character]AWD_SERIE") &&
                      prop.key.endsWith("TAPICERIA")
                  );
                  if (serieProperty) {
                    const serieChoices = await serieProperty.getChoices();
                    if (serieChoices) {
                      for (const serie of serieChoices) {
                        await serieProperty.setValue(serie.value);
                        await this.processVariant(element, sku, priceData, prefix_SERIE_TAP, priceErrors, counters);
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

  private buildSummary(
    sku: string,
    matches: number,
    discrepancies: number,
    priceErrors: PriceError[]
  ): void {
    const summarySection = document.createElement("div");
    summarySection.className = "summary-section";
    this.htmlContainerTestResultsSummary.appendChild(summarySection);

    const summaryTitle = document.createElement("h3");
    summaryTitle.innerText = `Summary for SKU: ${sku}`;
    summarySection.appendChild(summaryTitle);

    const summaryContent = document.createElement("div");
    summarySection.appendChild(summaryContent);

    const successCount = document.createElement("p");
    successCount.innerText = `Total Successes: ${matches}`;
    summaryContent.appendChild(successCount);

    const errorCount = document.createElement("p");
    errorCount.innerText = `Total Errors: ${discrepancies}`;
    summaryContent.appendChild(errorCount);

    if (discrepancies > 0) {
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

      for (const error of priceErrors) {
        const errorRow = document.createElement("tr");
        [error.sku, error.variantCode, error.price, error.sapPrice].forEach((text) => {
          const cell = document.createElement("td");
          cell.innerText = text;
          errorRow.appendChild(cell);
        });
        errorTbody.appendChild(errorRow);
      }
    }
  }

  private async getOneProduct(sku: string): Promise<void> {
    try {
      // Fetch price data and search for catalog items
      const priceData = await this.fetchPriceData(sku);
      const foundItems = await this.searchCatalogItems(sku);

      // Constants for property keys and variant prefix
      const AWD_TAPICERIA = "[Character]AWD_AWOPCION__TAPICERIA";
      const AWD_SERIE_TAPICERIA = "[Character]AWD_LISTAS__TAPICERIA";
      const prefix_SERIE_TAP = "AWSERIE_ASIE";

      // Append the prices table to the results container
      this.htmlContainerTestResults.appendChild(this.pricesTable);

      // Counters and error collection
      const counters = { matches: 0, discrepancies: 0 };
      const priceErrors: PriceError[] = [];

      // Process each found catalog item
      if (foundItems) {
        for (const scoredItem of foundItems.scoredItems) {
          const item = scoredItem.item;
          if (item instanceof catalog.ArticleCatalogItem) {
            const element = (await this.articleManager.insertArticle(item)) as cf.MainArticleElement;
            await this.processPropertyVariants(
              element,
              sku,
              AWD_TAPICERIA,
              AWD_SERIE_TAPICERIA,
              prefix_SERIE_TAP,
              priceData,
              priceErrors,
              counters
            );
          }
        }
      }

      console.log(`Total price matches: ${counters.matches}`);
      console.log(`Total discrepancies: ${counters.discrepancies}`);

      // Build and display the summary section
      this.buildSummary(sku, counters.matches, counters.discrepancies, priceErrors);
    } catch (error) {
      console.error("Error in getOneProduct:", error);
    }
  }
}
