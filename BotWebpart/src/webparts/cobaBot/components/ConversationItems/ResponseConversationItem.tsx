import * as React from 'react';
import { Guid } from '@microsoft/sp-core-library';
import styles from '../CobaBot.module.scss';
import { ConversationEngine } from './ConversationEngine';

export interface IResponseConversationItemProps{
    key: string;
    conversationEngine: ConversationEngine;
    jsonDefinition: any;
  }

export default class ResponseConversationItem extends React.Component<IResponseConversationItemProps, {}> {
  constructor(props) {
    super(props);
  }

  public render(): React.ReactElement<IResponseConversationItemProps> {
    const translatedText: string = this.props.conversationEngine.getTranslatedText(this.props.jsonDefinition.Text);
    const textWithAnswers: string = this.props.conversationEngine.replaceTokensWithQuestionAnswers(translatedText);

    return (
      <div className={styles.conversationBotRow}>
        <div 
          className={styles.conversationItem} 
          dangerouslySetInnerHTML={{__html: textWithAnswers}}
        />
      </div>
    );
  }
}