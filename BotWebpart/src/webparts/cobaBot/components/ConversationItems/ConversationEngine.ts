import * as React from 'react';
import ResponseConversationItem from './ResponseConversationItem';
import QuestionConversationItem from './QuestionButtonConversationItem';
import QuestionTextConversationItem from './QuestionTextConversationItem';
import { KeyedCollection } from '../../../../helper/KeyedCollection';
import { Guid } from '@microsoft/sp-core-library';

class conversationQuestionStackItem {
    public questionKey: string;
    public conversationTemplateIndex: number;
    public keyOfRelatedConversatoinItems: Array<string>;
}

export class ConversationEngine {
    private conversationTemplateJson: any;
    private UILanguage: string;

    public conversationItems: Array<React.ReactElement>;
    public conversationActive: boolean;
    private onPropertiesChanged: any;
    private onBotIsTyping: (para: boolean) => void;
    
    private currentConversationStepIndex: number = 0;
    private conversationQuestionsStack: Array<conversationQuestionStackItem>;
    private QuestionAnswers: KeyedCollection<string>;
    
    constructor(onConversationUpdated: any, onBotIsTyping: (para: boolean) => void, UILanguage: string) {
        this.onPropertiesChanged = onConversationUpdated;
        this.onBotIsTyping = onBotIsTyping;
        this.UILanguage = UILanguage;
        this.conversationActive = false;
    }

    get hasOneQuestionBeenAnswered(): boolean {
        return this.conversationQuestionsStack.length >= 2;
    }

    public startConversation(conversationTemplateJson:any) {
        this.conversationTemplateJson = conversationTemplateJson;
        this.restartConversation();
    }

    public restartConversation(){
        this.currentConversationStepIndex = 0;
        this.conversationItems = [];
        this.conversationQuestionsStack = new Array<conversationQuestionStackItem>();
        this.QuestionAnswers = new KeyedCollection<string>();

        this.calculateConversationItems();
        this.conversationActive = false;

        this.onPropertiesChanged();
    }

    public stoppConversation()
    {
        this.conversationActive = false;
        this.onPropertiesChanged();
    }

    public undoPreviousConversationStep() {
        if (this.conversationQuestionsStack.length < 2)
            return;

            
        if (this.conversationActive) {
            const currentQuestion: conversationQuestionStackItem = this.conversationQuestionsStack.pop();
            this.removeItemsFromConversationItems(currentQuestion.questionKey);
        }

        const previousQuestionToGoTo: conversationQuestionStackItem = this.conversationQuestionsStack.pop();
        this.removeItemsFromConversationItems(previousQuestionToGoTo.questionKey);
        previousQuestionToGoTo.keyOfRelatedConversatoinItems.map((i) => this.removeItemsFromConversationItems(i));
        
        this.currentConversationStepIndex = previousQuestionToGoTo.conversationTemplateIndex;
        this.conversationActive = true;
        this.calculateConversationItems();
    }

    public undoCoversationUntilItem(includingItemWithKey: string) {

        let q: conversationQuestionStackItem = this.conversationQuestionsStack.pop();

        while (q.questionKey != includingItemWithKey) {
            this.removeItemsFromConversationItems(q.questionKey);
            q.keyOfRelatedConversatoinItems.map((i) => this.removeItemsFromConversationItems(i));
            this.currentConversationStepIndex = q.conversationTemplateIndex;

            q = this.conversationQuestionsStack.pop();
        }

        this.removeItemsFromConversationItems(q.questionKey);
        q.keyOfRelatedConversatoinItems.map((i) => this.removeItemsFromConversationItems(i));
        this.currentConversationStepIndex = q.conversationTemplateIndex;

        this.conversationActive = true;
        this.calculateConversationItems();
    }

    private removeItemsFromConversationItems(withKey: string){
        const itemsWithoutTheOneWithTheKey = this.conversationItems.filter((item, index, array) => { return (item.key != withKey); });
        this.conversationItems = itemsWithoutTheOneWithTheKey;
    }

    private addQuestionToConversationStack(questionKey: string, conversationTemplateIndex: number) {
        const csi: conversationQuestionStackItem = {
            questionKey: questionKey,
            conversationTemplateIndex: conversationTemplateIndex,
            keyOfRelatedConversatoinItems: new Array<string>()
        };

        this.conversationQuestionsStack.push(csi);
    }

    private relateToCurrentConversationStackItem(keyOfItemToRelateTo: string) {
        if (this.conversationQuestionsStack.length > 0){
            const currentQuestion = this.conversationQuestionsStack[this.conversationQuestionsStack.length - 1];
            currentQuestion.keyOfRelatedConversatoinItems.push(keyOfItemToRelateTo);
        }
    }

    private calculateConversationItems() {
        let conversationItemsChanged: boolean = false;

        let nextStepToProcess: number = this.currentConversationStepIndex;

        do {
            this.currentConversationStepIndex = nextStepToProcess;
            let e = this.conversationTemplateJson.Conversation[nextStepToProcess];

            if (e == null) {
                console.warn("all done");
                this.conversationActive = false;
                this.onPropertiesChanged();
                return;
            }

            if (e.Response != null) {
                const conversationItemKey = Guid.newGuid().toString();
                let r = React.createElement(ResponseConversationItem, {key: conversationItemKey, conversationEngine: this, jsonDefinition: e.Response });
                this.relateToCurrentConversationStackItem(conversationItemKey);

                this.conversationItems.push(r);
                conversationItemsChanged = true;
                
                let goto: string = e.Response.Goto;
                if (goto != null)
                {
                    let gotoIndex: number = this.getIndexOfConversationItemByKey(goto);
                    nextStepToProcess = gotoIndex;
                }
                else
                    nextStepToProcess++;
            }
            else if (e.Question != null && e.Question.OptionType == "Button") {
                const conversationItemKey = Guid.newGuid().toString();
                let q = React.createElement(QuestionConversationItem, {key: conversationItemKey, conversationItemKey: conversationItemKey, conversationEngine: this, jsonDefinition: e.Question });
                this.addQuestionToConversationStack(conversationItemKey, nextStepToProcess);
                
                this.conversationItems.push(q);
                conversationItemsChanged = true;
            }
            else if (e.Question != null && (e.Question.OptionType == "Text" || e.Question.OptionType == "EMail")) {
                const conversationItemKey = Guid.newGuid().toString();
                let q = React.createElement(QuestionTextConversationItem, {key: conversationItemKey, conversationItemKey: conversationItemKey, conversationEngine: this, jsonDefinition: e.Question });
                this.addQuestionToConversationStack(conversationItemKey, nextStepToProcess);
                
                this.conversationItems.push(q);
                conversationItemsChanged = true;
            }
            else if (e.Decision != null) {

                let didOneExpressionMatch: boolean = false;

                for (const decision of e.Decision) {
                    let expression: string = decision.Expression;

                    let replacedExpression: string = this.replaceTokensWithQuestionAnswers(expression);
                    let evaluatedExpression: boolean = eval(replacedExpression);

                    if (evaluatedExpression) {
                        let goto: string = decision.Goto;
                        let nextIndex: number = this.getIndexOfConversationItemByKey(goto);
                        
                        if (nextIndex == -1) {
                            console.warn(`No item with key '{$goto}' for goto of expression '${expression}' found.`);
                        }
                        else {
                            nextStepToProcess = nextIndex;
                            didOneExpressionMatch = true;
                            break;
                        }
                    }
                }

                if (! didOneExpressionMatch) {
                    console.warn(`No expression matched for decision with expression with key todo!!! Stopping here :-/`);
                    conversationItemsChanged = true;
                    return;
                }
            }
            else if (e.HttpRequestAction != null) {
                this.conversationActive = true;     
                this.onBotIsTyping(true);

                const url: string = e.HttpRequestAction.Url;
                const httpRequestActionKey: string = e.HttpRequestAction["Key"].toLowerCase();

                this.QuestionAnswers.RemoveAllItemsWithKeysStartingWith(httpRequestActionKey + ".");

                const bodyPayload: string = this.QuestionAnswers.SerializeItemsAsJson();

                console.warn(`Found HttpRequestAction; Url: "${url}"; Key: "${httpRequestActionKey}"`);
                fetch(url, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'origin-when-cross-origin',
                    body: bodyPayload
                  })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(res.statusText);

                    let responseText = await res.text();
                    console.log(`Got response for HttpRequestAction; Key: "${httpRequestActionKey}"; Response: "${responseText}"`);

                    let responseObj = JSON.parse(responseText);
                    
                    for (const result in responseObj)
                    {
                        const answerKey: string = httpRequestActionKey + "." + result.toLowerCase();
                        const answerValue: string = responseObj[result];
                        console.log(`Store HttpRequestAction response to answers; answerKey: "${answerKey}"; answerValue: "${answerValue}"`);
                        this.QuestionAnswers.AddOrUpdate(answerKey, answerValue);    
                    }

                    this.onBotIsTyping(false);                    
                    this.currentConversationStepIndex++;
                    this.calculateConversationItems();
                });
            }
            else {
                console.warn(`Cannot process element "${e.toString()}". Stopping here :-/ TODO`);
            }
        } while (nextStepToProcess != this.currentConversationStepIndex);

        if (conversationItemsChanged)
            this.onPropertiesChanged();
    }

    public getTranslatedText(jsonElement: any): string {
        const UILanguage: string = this.UILanguage.toLowerCase();

        if (jsonElement.hasOwnProperty(UILanguage))
            return jsonElement[UILanguage];
        else
            return jsonElement.default;
    }

    private getIndexOfConversationItemByKey(keyToSearch: string): number {
        for (let itemIndex: number = 0; itemIndex < this.conversationTemplateJson.Conversation.length; itemIndex++) {
            let itemIndexObject = this.conversationTemplateJson.Conversation[itemIndex];
            for (const key in itemIndexObject) {
                if (itemIndexObject.hasOwnProperty(key)) {
                    const element = itemIndexObject[key];
                    if (element != null) {
                        if (element.Key && element.Key == keyToSearch) {
                            let nextIndex: number = itemIndex;
                            return nextIndex;
                        }
                    }
                    else {
                        console.warn("Please check. Ignoring strange element: " + JSON.stringify(itemIndexObject));
                    }
                }
            }
        }
        console.warn("Failed to find conversation item with key '" + keyToSearch + "'");
    }

    public replaceTokensWithQuestionAnswers(stringContainingTokens: string): string {

        let replacedExpression: string = stringContainingTokens.replace(/\{\{(.*?)\}\}/g, (i, match) => {
            if (this.QuestionAnswers.ContainsKey(match.toLowerCase())) {
                return this.QuestionAnswers.Item(match.toLowerCase());
            }
            else {
                console.warn(`No response found for expression '${stringContainingTokens}'`);
                return "{{" + match + "}}";
            }
        });

        return replacedExpression;
    }

    public answerQuestion(questionKey: string, answerToQuestion: string, nextConversationItemKey: string = null) {
        this.conversationActive = true;     
        this.onBotIsTyping(true);
        setTimeout(
            function() {
                this.onBotIsTyping(false);
                
                if (answerToQuestion != null)
                    this.QuestionAnswers.AddOrUpdate(questionKey.toLowerCase(), answerToQuestion);

                if (nextConversationItemKey == null)
                    this.currentConversationStepIndex++;
                else
                    this.currentConversationStepIndex = this.getIndexOfConversationItemByKey(nextConversationItemKey);
                this.calculateConversationItems();
            }
            .bind(this),
            888
        );
    }
}