import * as React from 'react';
import styles from './CobaBot.module.scss';
import { escape } from '@microsoft/sp-lodash-subset';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { ConversationEngine } from './ConversationItems/ConversationEngine';

export interface ICobaBotProps {
  ConversationTemplate: string;
  DefaultHeight: number;
  ConversationHeight: number;
  UILanguage: string;
  DisplayStopConversationButton: boolean;
}

export interface ICobaBotState {
  conversation: Array<object>;
  conversationActive: boolean;
}

export default class CobaBot extends React.Component<ICobaBotProps, ICobaBotState> {

  private conversationEngine: ConversationEngine;

  private reactFooterRef: any;
  private reactContainerRef: any;

  constructor(props: ICobaBotProps) {
    super(props);
    this.reactFooterRef = React.createRef();
    this.reactContainerRef = React.createRef();

    this.state = { 
      conversation: [],
      conversationActive: false
    };
  }

  public async componentDidMount() {
    let parsedConversationTemplate: object = JSON.parse(this.props.ConversationTemplate);

    this.conversationEngine = new ConversationEngine(this.onConversationPropertiesChanged, this.props.UILanguage);
    this.conversationEngine.startConversation(parsedConversationTemplate);
  }

  public componentWillReceiveProps(newProps) {
    if (this.props.ConversationTemplate != newProps.ConversationTemplate) {
      let parsedConversationTemplate: object = JSON.parse(newProps.ConversationTemplate);
      this.conversationEngine = new ConversationEngine(this.onConversationPropertiesChanged, this.props.UILanguage);
      this.conversationEngine.startConversation(parsedConversationTemplate);
    }
  }

  public async componentDidUpdate() {
    this.scrollToFooter();
  }

  private onConversationPropertiesChanged = async (): Promise<void> => {
    let updatedConversationItems = [].concat(this.conversationEngine.conversationItems);
    this.setState({
      conversation: updatedConversationItems,
      conversationActive: this.conversationEngine.conversationActive
    });
  }

  private onConversationStoppedClicked(e) {
    e.preventDefault();
    this.conversationEngine.stoppConversation();
  }

  private onConversationRestartClicked(e) {
    e.preventDefault();
    this.conversationEngine.restartConversation();
  }

  private onUndoConversationStepClicked(e) {
    e.preventDefault();
    this.conversationEngine.undoPreviousConversationStep();
  }

  public render(): React.ReactElement<ICobaBotProps> {

    const outerDivStyle = {
      height: this.state.conversationActive ? this.props.ConversationHeight : this.props.DefaultHeight
    };

    return (
      <div className={styles.cobaBot}>
        <div className={styles.outerContainer} style={outerDivStyle} >
          <div className={styles.topRightMenuOuterDiv}>
            { (this.conversationEngine && this.conversationEngine.hasOneQuestionBeenAnswered) && 
              <a onClick={(e) => this.onConversationRestartClicked(e)} title="Restart conversation"><Icon iconName='Refresh' className={styles.toprightMenuLinkIcon} /></a>
            }
            { ((this.conversationEngine && this.conversationEngine.conversationActive) && this.props.DisplayStopConversationButton) && 
              <a onClick={(e) => this.onConversationStoppedClicked(e)} title="Stop conversation"><Icon iconName='CircleStop' className={styles.toprightMenuLinkIcon} /></a>
            }
            { (this.conversationEngine && this.conversationEngine.hasOneQuestionBeenAnswered) && 
              <a onClick={(e) => this.onUndoConversationStepClicked(e)} title="Undo last conversation step"><Icon iconName='Undo' className={styles.toprightMenuLinkIcon} /></a>
            }
          </div>
          <div className={styles.container} ref={this.reactContainerRef} >
            { this.state.conversation }
            <div ref={this.reactFooterRef} className={styles.footer} ></div>
          </div>
        </div>
      </div>
    );
  }

  private scrollToFooter(): void {
    this.scrollTo(this.reactContainerRef.current, this.reactFooterRef.current);
  }

  private scrollTo(element, to) {
    let currentPosition: number = element.scrollTop;
    let endPosition: number = to.offsetTop;
    let scrollIncrement: number = 20;

    var animateScroll = () => {        
        currentPosition += scrollIncrement;
        element.scrollTop = currentPosition;
        if(currentPosition < endPosition) {
            setTimeout(animateScroll, 15);
        }
    };
    animateScroll();
  }
}