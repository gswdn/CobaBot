import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneToggle,
  PropertyPaneLabel,
  PropertyPaneLink
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'CobaBotWebPartStrings';
import CobaBot from './components/CobaBot';
import { ICobaBotProps } from './components/CobaBot';
import { PropertyFieldNumber } from '@pnp/spfx-property-controls/lib/PropertyFieldNumber';
import { PropertyFieldCodeEditor, PropertyFieldCodeEditorLanguages } from '@pnp/spfx-property-controls/lib/PropertyFieldCodeEditor';
import * as PnPTelemetry from '@pnp/telemetry-js';


export interface ICobaBotWebPartProps {
  ConversationTemplate: string;
  DefaultHeight: number;
  ConversationHeight: number;
  DisplayStopConversationButton: boolean;
  PNPTelemetryEnabled: boolean;
}

export default class CobaBotWebPart extends BaseClientSideWebPart<ICobaBotWebPartProps> {
  public render(): void {

    const currentUILanguage: string = this.getCurrentUICulture();

    const element: React.ReactElement<ICobaBotProps> = React.createElement(
      CobaBot,
      {
        ConversationTemplate: this.properties.ConversationTemplate,
        DefaultHeight: this.properties.DefaultHeight,
        ConversationHeight: this.properties.ConversationHeight,
        UILanguage: currentUILanguage,
        DisplayStopConversationButton: this.properties.DisplayStopConversationButton
      }
    );

    ReactDom.render(element, this.domElement);
  }

  public getCurrentUICulture(): string {
    let currentUrl: string = window.location.href.toLowerCase();

    if (currentUrl.indexOf("/en/") > -1) return "en-US";
    else if (currentUrl.indexOf("/de/") > -1) return "de-DE";
    else if (currentUrl.indexOf("/fr/") > -1) return "fr-FR";
    else if (currentUrl.indexOf("/hu/") > -1) return "hu-HU";
    else if (currentUrl.indexOf("/it/") > -1) return "it-IT";
    else if (currentUrl.indexOf("/nl/") > -1) return "nl-NL";
    else if (currentUrl.indexOf("/sl/") > -1) return "sl-SI";
    else if (currentUrl.indexOf("_en.") > -1) return "en-US";
    else if (currentUrl.indexOf("_de.") > -1) return "de-DE";    
    else return this.context.pageContext.cultureInfo.currentUICultureName;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  public onCustomPropertyPaneFieldChanged(targetProperty: string, newValue: any) {
    const oldValue = this.properties[targetProperty];
    this.properties[targetProperty] = newValue;

    this.onPropertyPaneFieldChanged(targetProperty, oldValue, newValue);

    this.render();

  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {

    if (!this.properties.PNPTelemetryEnabled) {
      const telemetry = PnPTelemetry.default.getInstance().optOut();
    }

    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyFieldCodeEditor('ConversationTemplate', {
                  label: 'Conversation Template',
                  panelTitle: 'Conversation Template',
                  initialValue: this.properties.ConversationTemplate,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  key: 'ConversationTemplate',
                  language: PropertyFieldCodeEditorLanguages.JSON
                }),
                PropertyFieldNumber("DefaultHeight", {
                  key: "DefaultHeight",
                  label: "Default height",
                  description: "Default height in px, when no conversation is active.",
                  value: this.properties.DefaultHeight,
                  maxValue: 9999,
                  minValue: 100,
                  disabled: false
                }),
                PropertyFieldNumber("ConversationHeight", {
                  key: "ConversationHeight",
                  label: "Conversation height",
                  description: "Height of webpart is extended to this value in px, when a conversation is active.",
                  value: this.properties.ConversationHeight,
                  maxValue: 9999,
                  minValue: 100,
                  disabled: false
                }),
                PropertyPaneToggle('DisplayStopConversationButton', {
                  label: 'Display "stop converstion" button'
                })
              ]
            },
            {
              groupName: 'Telemetry',
              groupFields: [
                PropertyPaneLabel('PNPTelemetryLabel', {
                  text: 'CobaBot uses code/controls from the Microsoft Patterns And Practices community (PNP). These controls submit telemetry data. If you like to support them, you can turn on the switch below.'
                }),
                PropertyPaneLink('PNPGroupLink', {
                  text: 'More about Microsoft PNP',
                  href: 'https://pnp.github.io/',
                  target: '_blank'
                }),
                PropertyPaneLink('PNPTelemetryLink', {
                  text: 'More about PNP Telemetry',
                  href: 'https://github.com/pnp/telemetry-proxy-node#pnp-nodejs-based-telemetry-proxy-for-application-insights',
                  target: '_blank'
                }),
                PropertyPaneToggle('PNPTelemetryEnabled', {
                  label: 'Transmit telemetry data',
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
