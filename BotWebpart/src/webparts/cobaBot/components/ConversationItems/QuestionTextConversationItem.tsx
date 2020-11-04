import * as React from 'react';
import { ConversationEngine } from './ConversationEngine';
import { Guid } from '@microsoft/sp-core-library';
import styles from '../CobaBot.module.scss';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TextField } from 'office-ui-fabric-react';
import { IconButton, IIconProps, IContextualMenuProps, Stack, Link } from 'office-ui-fabric-react';
const NavigateForward: IIconProps = { iconName: 'NavigateForward' };

export interface IQuestionTextConversationItemItemProps {
  conversationItemKey: string;
  conversationEngine: ConversationEngine;
  jsonDefinition: any;
}

export interface IQuestionTextConversationItemItemState {
  questionAnswerControlsAreaVisible: boolean;
  userResponseAreaVisible: boolean;
  userResponseText: string;
  submitButtonEnabled: boolean;
}

export default class ResponseConversationItem extends React.Component<IQuestionTextConversationItemItemProps, IQuestionTextConversationItemItemState> {
  private questionKey: string;

  constructor(props: IQuestionTextConversationItemItemProps) {
    super(props);

    this.state = { 
      questionAnswerControlsAreaVisible: true,
      userResponseAreaVisible: false,
      userResponseText: "",
      submitButtonEnabled: false,
    };

    this.questionKey = props.jsonDefinition.Key;
  }

  private onSaveButtonClick = async (): Promise<void> => {
    this.setState({ 
      questionAnswerControlsAreaVisible: false,
      userResponseAreaVisible: true,
    });

    this.props.conversationEngine.answerQuestion(this.questionKey, this.state.userResponseText);
  }

  handleInputTextFieldonKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13 && this.state.userResponseText.length > 0)
      this.onSaveButtonClick();
  }

  private handleTextfieldChange = async (e: React.FormEvent<HTMLInputElement>): Promise<void> => {
    const valueAsString: string = (e.target as any).value;

    if (valueAsString && valueAsString.length > 0) {
      this.setState({
        submitButtonEnabled: true,
        userResponseText: valueAsString,
      });
    } else {
      this.setState({
        submitButtonEnabled: false,
        userResponseText: "",
      });
    }
  };

  private onUndoLinkClick = async (e): Promise<void> => {
    e.preventDefault();
    this.props.conversationEngine.undoCoversationUntilItem(this.props.conversationItemKey);
  }


  public render(): React.ReactElement<IQuestionTextConversationItemItemProps> {
    const translatedQuestionText: string = this.props.conversationEngine.getTranslatedText(this.props.jsonDefinition.Text);
    const domRef = React.createRef();
  

    return (
      <div>
        <div className={styles.conversationBotRow}>
          <div  className={styles.conversationItem}>
            <div dangerouslySetInnerHTML={{__html: translatedQuestionText}}>
            </div>
          </div>
        </div>

        <div className={styles.conversationUserRow}>
          <div className={styles.conversationItem}>
            { this.state.questionAnswerControlsAreaVisible
                ? <div className={styles.questionTextPanel} >
                      <TextField 
                        className={styles.questionTextBox}
                        autoFocus 
                        type={this.props.jsonDefinition.OptionType}
                        value={this.state.userResponseText}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => this.handleTextfieldChange(e)}
                        onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => this.handleInputTextFieldonKeyUp(e)}
                      />                  
                      <IconButton className={styles.questionTextboxSubmitButton} iconProps={NavigateForward} title="Submit" ariaLabel="Emoji" disabled={! this.state.submitButtonEnabled} onClick={ () => this.onSaveButtonClick() }/>
                  </div>
                : null
            }
            { this.state.userResponseAreaVisible
                ? <div className={styles.questionUseranswerPanel}>
                    <div>
                      { this.state.userResponseText }
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