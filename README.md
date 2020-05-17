## What is guerilla-coba-bot

CobaBot is a very simple chatbox, especially designed for simple chats that follow a so called decision tree.
The bot asks questions, that are answered by the user. Depending on the answer, different responses and additional questions are possible.
CobaBot is a SharePoint SPFx webpart, so no additional infrastrucutre is required.
The conversation is based on a so called conversation template (JSON/YAML), that defines questions, responses and decisions.

![Animated GIF showing a sample CobaBot conversation](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_TeaserChat.gif)

## Just wanna use it?
* Download the latest sppkg file, which can be found in the "Package" subfolder here on GitHub.
* Create an App Catalog for your SharePoint Online Tenant 
* Upload the "guerilla-cobabot.sppkg" file and deploy the solution.
* If the app is not deployed tenant-wide, you have to add the app to the SiteCollection, where you'd like to use it.
* Edit a page and add the CobaBot WebPart.
* Check out the details below on the Conversation Template to learn, how to control the conversation.

![Screenshot on how to add CobaBot to a page](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_AddWebpart.png)

## Conversation Template
### Basics

CobaBot follows a conversation based on a template ("Conversation Template").

The template is set as JSON in the webpart properties. I prefer to write the Conversation Template as YAML and then convert it to JSON. In a later version, it's planned that YAML can directly be set in the properties. The samples below are all in JSON anyway.

The Conversation Template defines the conversation, that means: Responses, Questions, and Decisions. Let's name them Conversation Items.
Each Conversation Item should have a key to uniquely identify it. This gets important for jumping to a particular Conversation Item.
The Conversation Template is processed from top to bottom unless an explicit "goto" is executed.

Conversation Items:
* **Responses** are just rendered as written chat messages from the bot to the user.
* **Questions** are something, the bot asks. You can define possible answers that will be rendered as buttons.
* **Decisions** are made depending on the user's answer to a question. In particular, that means jumping to another Conversation Item identified by its unique key ("Goto").

Details on the particular Conversation Items can be found below.

A sample Conversation Template is included in the GIT repro ("SampleConversationTemplate.json" / "SampleConversationTemlate.yaml") or it's within the default webpart's properties.


Simplified, the general structure is as follows:
```
{
  "Conversation": [
    {
      "Response": { ... }
    },
    {
      "Question": { ... }
    },
    {
      "Decision": [...]
    },
    ...
  ]
}
```

#### Localization
CobaBot supports localization. That means, it supports defining Responses and Questions in multiple languages within one Conversation Template.

##### Language detection
The language is selected by the locale given in the SharePoint context.


Since SharePoint Sites don't offer native localization/translations yet, I normally create a dedicated page for each language and use the URL to distinguish them, e.g. ".../SitePages/PageName_EN.aspx" or ".../SitePages/PageName_DE.aspx". So, if the URL contains "_DE." or "_EN.", the corresponding SharePoint locale is overwritten by DE or EN.

##### Setting translated texts
Each Text Item in the Conversation Template has a default language text. This is choosen, if no additionally specified language item matches. Otherwise, the specified more specific locale text is used. If you don't need translated texts, just go ahead with the default text only.

Example:
```
"Text": {
    "default": "Ok. What's on your mind?",
    "de-de": "Ok. Was beschäftigt dich gerade?"
}
```

Default Text is "Ok. What's on your mind?".
Translated Text for German is "Ok. Was beschäftigt dich gerade?".

### Responses
Responses are just written messages from the bot. You can use them wherever you want your bot to chat something to the user. So, let's use the following to say "Hello" to our user:

```
"Response": {
    "Text": {
        "default": "Hello.",
        "de-de": "Hallo."
    }
}
```
![Screenshot of a response](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_HelloResponse.png)

### Questions
Questions are asked by the bot and answered by the user. You can ask multiple questions in a row. The decision on how the conversation goes on is made by Decision Conversation Items.

Let's have a closer look at the following example:
```
"Question": {
    "Key": "AnythingElseQuestion",
    "Text": {
        "default": "Is there anything else on your mind?",
        "de-de": "Beschäftigt dich noch was?"
    },
    "OptionType": "Button",
    "Options": [
        {
        "ButtonText": {
            "default": "Yes",
            "de-de": "Ja"
        },
        "AnswerText": {
            "default": "Yes",
            "de-de": "Ja"
        },
        "AnswerValue": true
        },
        {
        "ButtonText": {
            "default": "No",
            "de-de": "Nein"
        },
        "AnswerText": {
            "default": "No, thanks.",
            "de-de": "Nein danke."
        },
        "AnswerValue": false
        }
    ]
}
```
* **Key**: Each question should have a Key to uniquely identify it. The user's answer to the questions also will be stored in an "internal variable" identified by the question key. That "internal variables" become important for Decision Conversation Items as described later. For now, just keep in mind that the user's answer is stored.
* **Text**: That is the text, that is chatted to the user. As described above, you can use different texts for different locales.
* **OptionType**: honestly: ignored in the current version. Maybe, in the future, we'll also support DropDowns oder free-text fields. Just keep in in your definitions and you should be prepared for the future.
* **Options**: An array of options for the user to choose from. Each option is rendered as a button and has again the following properties. You should as least have two options and even more are perfectly fine. Just keep in mind, that each option is rendered as a button and you don't want to overwelm the user.
  * **ButtonText**: Displayed on the button itself.
  * **AnswerText**: Displayed in the user's chat message, after a button was clicked and the question has been answered.
  * **AnswerValue**: The string stored in the "internal variable" if this answer has been choosen by the user.

The sample above looks as follows
* unanswered
![Screenshot of an unanswered question](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_Question_unanswered.png)
* answered
![Screenshot of an answered question](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_Question_answered.png)

### Decisions
Decisions control the flow of the conversation. 

A decisions consist of an array of "Expressions". The expressions are evaluated from top to bottom. If an Expression evaluates to "true", the bot jumps to the respectively given Conversation Item ("Goto") and stops the evaluation of fellow expressions.

Let's have a look at the following simple example, which basically means: _If the Question "AnythingElseQuestion" was answered with "Yes" (that means: "AnswerValue" is "true"), goto the Conversation Item with the key "WhatsOnYourMindQuestion". Else, goto "ThankYouResponse"._

Assume, the user clicked on the "Yes" button for the "AnythingElseQuestion" (for question: see above). The "AnswerValue" is "true", which means, "true" (as a string) is written to the "internal variable" with the name "AnythingElseQuestion". Remember: the variable has the same name as the key of the question.

```
"Decision": [
    {
        "Expression": "{{AnythingElseQuestion}}",
        "Goto": "WhatsOnYourMindQuestion"
    },
    {
        "Expression": "true",
        "Goto": "ThankYouResponse"
    }
]
```

For each expression, the following two steps are processed:

1) **Placeholders are resolved.** Here, the "internal variables" from questions come into play again. They are used as placeholders (enclosed by curly brackets) in expressions and are replaced with its value. So now, "{{AnythingElseQuestion}}" is replaced with "true".

2) **Evaluation** The replaced expression is treated as a JavaScript statement and evaluated. If it's true, the expression is true and the goto is executed. In our example, we have "true" so the conversation jumps to the Conversation Item "WhatsOnYourMindQuestion".

Now assume, the user clicked the "No" button. The "internal variable" "AnythingElseQuestion" gets an "AnswerValue" of "false". "{{AnythingElseQuestion}}" is therefore replaced with "false" and everything is evaluated. That also results in "false", so we don't execute this goto and the next expression is taken. This time, there is no placeholder to resolve. It's just "true". This is evaluated again, obviously results to "true", so that goto is executed and the conversation jumps to the ConversationItem with the key "ThankYouResponse".

You can have more than two expressions in a decision and you can also have more complex ones. Please also check the included SampleConversationTemplate.

Some more examples explained:

1) '{{toiletpaperQuestion}}' == 'onlyOne' && {{storesOpenTodayQuestion}}
   * assume, "toiletpaperQuestion" has been answered with "onlyOne" (AnswerValue = "onlyOne").
   * assume, "storesOpenTodayQuestion" has been answered with "Yes" (AnswerValue = "true").
   * "{{toiletpaperQuestion}}" and "{{storesOpenTodayQuestion}}" are replaced by the values in the "internal variables". So, the expression becomes "'onlyOne' == 'onlyOne' && true"
   * Treated as a JavaScript expression, that evaluates to true, so the goto is executed.
2) !{{storesOpenTodayQuestion}}
   * assume, the question "storesOpenTodayQuestion" was answered with "No", so its "AnswerValue" is "false".
   * "{{StoresOpenTodayQuestion}}" is replaced with "false" in this case.
   * the expression then is "! false".
   * Treated as JavaScript, this is "true" and the goto is executed.

## For contributors

If you'd like to contribute, please contact me with your idea.
Please do not just provide a pull request or code without getting in touch first.

### Building the code

If you're already prepared for SPFx development
* git clone the repo
* npm install
* gulp

### local serving and testing
gulp serve


### Prepare Package

#### Tests
Must be done manually, still.
Test in Chrome and Internet Explorer.
IE is still used out there and it really behaves differently.

#### Creating the package
* gulp clean
* gulp build
* gulp bundle --ship
* gulp package-solution --ship

### CI Builds
There's an automated build action which is triggered on each checkin to the master branch. The latest package is then checked into the "Package" folder.