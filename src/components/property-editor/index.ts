import { MultiPropertyProvider, Property, PropertyChangedResult, PropertyClass, PropertyValue, groupProperties } from '@easterngraphics/wcf/modules/core/prop';
import { isNullOrEmpty } from '@easterngraphics/wcf/modules/utils/string';
import { HtmlUtils } from '../../utils';
import { ProgressUI } from '../progress';
import './index.css';
import { ArticlePropertyHelpers } from '@easterngraphics/wcf/modules/cf';
import { ArticleData } from '@easterngraphics/wcf/modules/eaiws/basket';
/**
 * For configuring articles.
 * Shows article properties and their options to the user. So he can change properties of an article.
 */
export class PropertyEditorUI {
    private activeProperty: Property | null; // the current by the user clicked property, null if no property is clicked
    private propertyProvider: MultiPropertyProvider; // current selected element, which provides the properties (will be updated by the core)
    private htmlContainer: HTMLElement;

    constructor(htmlContainer: HTMLElement, propertyProvider: MultiPropertyProvider) {
        this.propertyProvider = propertyProvider;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.propertyProvider.eventPropertiesChanged.addListener(this.onPropertiesChanged.bind(this));
        this.htmlContainer = htmlContainer;
    }
    private async onPropertiesChanged(result?: PropertyChangedResult): Promise<void> {
        if (result !== PropertyChangedResult.Nothing) {
            this.activeProperty = null;
            await this.updatePropertyEditor();
        }
    }

    /**
     * Gets properties/classes/choices of the current property provider and creates ui for those.
     */
    private async updatePropertyEditor(): Promise<void> {
    
        HtmlUtils.removeAllChildren(this.htmlContainer);
        try {
         //TEST-mesas   console.log('updatePropertyEditor');
            const propertyClasses: Array<PropertyClass> = await this.propertyProvider.getPropertyClasses();
        //TEST-mesas   console.log(propertyClasses);
            
            const properties: Array<Property> = await this.propertyProvider.getProperties();

for (let i = 0; i < properties.length; i++) {
  //TEST-mesas  console.log("userData");
    const userData = ArticlePropertyHelpers.GetPropertyUserData(properties[i]);
   //TEST-mesas console.log(userData);
}

        //TEST-mesas    console.log(properties);
            const propertyGroups = groupProperties(properties, propertyClasses, { defaultClassName: 'Properties' });
            propertyGroups.forEach((group) => {
                const htmlPropertyClass: HTMLElement = this.createPropertyClass(group.class);
                this.htmlContainer.appendChild(htmlPropertyClass);
                group.properties.forEach((property) => {
                    // if (this.getPropertyKey(property) === 'EGROFFICE_OFFICE2_MAT__Bezug') { // this example shows, how we could filter out properties, based on their key
                    //     return;
                    // }
                    
                    htmlPropertyClass.appendChild(this.createProperty(property));
                });
            })

            
        } catch (e) {
            console.error('failed to get properties', e);
            this.htmlContainer.innerText = 'Migration of article might be required.';
        }
    }

    /**
     * Property classes are like a category for properties.
     */
    private createPropertyClass(propertyClass: PropertyClass): HTMLElement {
        const propClassHtml: HTMLDivElement = document.createElement('div');
        if (propertyClass.name != null) {
            propClassHtml.innerText = propertyClass.name;
        }
        propClassHtml.className = 'property-class';
        return propClassHtml;
    }

    private createProperty(property: Property): HTMLElement {
        const propertyHtml: HTMLDivElement = document.createElement('div');
        const propertyValue: PropertyValue | null = property.getValue();
        propertyHtml.innerText = property.getName() + ': ' + (propertyValue?.text ?? '');
        propertyHtml.className = 'property';
        if (property.editable && property.visible) {
            propertyHtml.onclick = this.onPropertyClick.bind(this, property);
        }


        // save information in dataset css
        propertyHtml.dataset.editable = property.editable ? 'true' : 'false';
        propertyHtml.dataset.visible = property.visible ? 'true' : 'false';
        propertyHtml.dataset.choiceList = property.choiceList ? 'true' : 'false';
        

        // if (property.key === "[Character]AWD_AWSERIE__ASIENTO__PLAF")
        //     {propertyHtml.dataset.visible = 'false';}



        return propertyHtml;
    }

    private removeAllPropertyChoices(): void {
        const propertyChoices: HTMLCollectionOf<Element> = document.getElementsByClassName('property-choice');
        let propertyChoice: Element | null = propertyChoices.item(0);
        while (propertyChoice != null) {
            propertyChoice.remove();
            propertyChoice = propertyChoices.item(0);
        }
    }
    

    /**
     * If user clicks a property we show the possible choices or let the user directly input a value (depending on the property type).
     * We store the current clicked property in activeProperty.
     * If it will be clicked again, we remove the choices.
     */
    private async onPropertyClick(property: Property, mouseEvent: MouseEvent): Promise<void> {
 
        ProgressUI.beginLoading();
        this.removeAllPropertyChoices(); 
        if (this.activeProperty !== property) {
            if (property.choiceList) {
                const propertyChoices: Array<PropertyValue> | null = await property.getChoices();
                if (propertyChoices != null) {
                    propertyChoices.forEach((propertyValue: PropertyValue) => {
                        if (mouseEvent.target instanceof HTMLElement) {
                            mouseEvent.target.appendChild(this.createPropertyChoice(property, propertyValue));
                        }
                    });
                }
            } else {
                const userInput: string | null = prompt(property.getName());
             //   console.log(userInput);
                if (userInput != null) {
                    await property.setValue(userInput);
                }
            }
            this.activeProperty = property;
        } else {
            this.activeProperty = null;
        }
        ProgressUI.endLoading();
    }

  

    private createPropertyChoice(
        property: Property,
        propertyValue: PropertyValue,
    ): HTMLElement {
        const propertyChoice: HTMLDivElement = document.createElement('div');
        propertyChoice.className = 'property-choice' + (property.getValue()?.value === propertyValue.value ? ' selected' : '');

        propertyChoice.onclick = async (e) => {
            if (!propertyValue.selectable) {
                e.stopPropagation();
                return;
            }
            ProgressUI.beginLoading();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////        
       /*     const choices = await property.getChoices();
            if (choices && choices.length >= 4) {
                await property.setValue(choices[3].value);
            }*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        //TEST-mesas    console.log(this.getPropertyKey(property));
            await property.setValue(propertyValue.value);
        
            ProgressUI.endLoading();
        };
        if (!isNullOrEmpty(propertyValue.largeIcon)) {
            const icon: HTMLImageElement = document.createElement('img');
            icon.src = propertyValue.largeIcon;
            propertyChoice.appendChild(icon);
        }
        if (!isNullOrEmpty(propertyValue.text)) {
            const label: HTMLDivElement = document.createElement('div');
            label.innerText = propertyValue.text;
            if (!propertyValue.selectable) {
                label.style.color = 'grey';
            }
            propertyChoice.appendChild(label);
        }
        return propertyChoice;
    }
    /**
    * Returns the key of a property.
    * Instead on relying on the internal property.key (which can change in the future), we return here a key based on OFML information.
    */
    private getPropertyKey(property: Property): string {
        const userData = ArticlePropertyHelpers.GetPropertyUserData(property);
        if (userData == null) {
            throw new Error('Should never be null in context of ofml data handling!')
        }
     
        const eaiwsProperty = userData.eaiwsProperty;
      //TEST-mesas  console.log(eaiwsProperty);
     //TEST-mesas   console.log(property);
        const eaiwsArticleData = userData.eaiwsArticleData
        return `${eaiwsArticleData.manufacturerId}_${eaiwsArticleData.seriesId}_${eaiwsProperty.propName}`;
    }
}
