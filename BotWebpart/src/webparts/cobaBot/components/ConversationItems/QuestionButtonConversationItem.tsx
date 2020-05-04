import * as React from 'react';
import { ConversationEngine } from './ConversationEngine';
import { Guid } from '@microsoft/sp-core-library';
import styles from '../CobaBot.module.scss';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

export interface IQuestionButtonConversationItemProps {
  conversationItemKey: string;
  conversationEngine: ConversationEngine;
  jsonDefinition: any;
}

export interface IQuestionButtonConversationItemState {
  questionAnswerControlsAreaVisible: boolean;
  userResponseAreaVisible: boolean;
  userResponseDisplayText: string;
}

export default class ResponseConversationItem extends React.Component<IQuestionButtonConversationItemProps, IQuestionButtonConversationItemState> {
  private questionKey: string;

  constructor(props: IQuestionButtonConversationItemProps) {
    super(props);

    this.state = { 
      questionAnswerControlsAreaVisible: true,
      userResponseAreaVisible: false,
      userResponseDisplayText: "" 
    };

    this.questionKey = props.jsonDefinition.Key;
  }

  private onSaveButtonClick = async (answerValue: string, answerText: string): Promise<void> => {
    this.setState({ 
      questionAnswerControlsAreaVisible: false,
      userResponseAreaVisible: true,
      userResponseDisplayText: answerText
    });

    this.props.conversationEngine.answerQuestion(this.questionKey, answerValue);
  }

  private onUndoLinkClick = async (e): Promise<void> => {
    e.preventDefault();
    this.props.conversationEngine.undoCoversationUntilItem(this.props.conversationItemKey);
  }

  private renderButtons(props)
  {
    const _this = props.this;
    const onSaveButtonClick = _this.onSaveButtonClick;
    const jsonOptionsDefinition = _this.props.jsonDefinition.Options;
    const conversationEngine = _this.props.conversationEngine;

    return (
      <div>
        { jsonOptionsDefinition.map(o => _this.renderButton(o, onSaveButtonClick, conversationEngine)) }
      </div>
    );
  }

  private renderButton(jsonButtonDefinition, onSaveButtonClick, conversationEngine) {
    const translatedButtonText: string = conversationEngine.getTranslatedText(jsonButtonDefinition.ButtonText);
    const translatedAnswerText: string = conversationEngine.getTranslatedText(jsonButtonDefinition.AnswerText);
    const uniqueKey: string = Guid.newGuid().toString();

    return (
      <button key={uniqueKey} className={styles.button} onClick={ () => onSaveButtonClick(jsonButtonDefinition.AnswerValue, translatedAnswerText) }>{translatedButtonText}</button>
    );
  }

  public render(): React.ReactElement<IQuestionButtonConversationItemProps> {
    const translatedQuestionText: string = this.props.conversationEngine.getTranslatedText(this.props.jsonDefinition.Text);
    const domRef = React.createRef();
  

    return (
      <div>
        <div className={styles.conversationBotRow}>
          <div  className={styles.conversationItem}>
            <div dangerouslySetInnerHTML={{__html: translatedQuestionText}}
              >
            </div>
          </div>
        </div>

        <div className={styles.conversationUserRow}>
          <div className={styles.conversationItem}>
            { this.state.questionAnswerControlsAreaVisible
                ? <div className={styles.questionButtonPanel} >
                    <this.renderButtons this={this} />
                  </div>
                : null
            }
            { this.state.userResponseAreaVisible
                ? <div className={styles.questionUseranswerPanel}>
                    <div>
                      { this.state.userResponseDisplayText }
                    </div>
                    <div className={styles.questionUserAnswerContextPanel}>
                      <a onClick={(e) => this.onUndoLinkClick(e)} title="Go back to this question."><Icon iconName='Rewind' className={styles.questionUserAnswerContextPanelButton} /></a>
                    </div>
                  </div>
                : null
            }
          </div>
        </div>
      </div>
    );
  }
}