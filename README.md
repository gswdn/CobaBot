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

The Conversation Template defines the conversation, that means: Responses, Questions, Decisions and HttpRequestActions. Let's name them Conversation Items.
Each Conversation Item should have a key to uniquely identify it. This gets important for jumping to a particular Conversation Item.
The Conversation Template is processed from top to bottom unless an explicit "goto" is executed.

Conversation Items:
* **Responses** are just rendered as written chat messages from the bot to the user.
* **Questions** are something, the bot asks. You can define possible answers that will be rendered as buttons or have a text box to capture user input.
* **Decisions** are made depending on the user's answer to a question. In particular, that means jumping to another Conversation Item identified by its unique key ("Goto").
* **HttpRequestAction** can be used to reach out to a json-based webservice in order to access backend processing logic.

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
      "HttpRequestAction": { ... }
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


Since SharePoint Sites did not offer native localization/translations for a long time, I normally created a dedicated page for each language and use the URL to distinguish them, e.g. ".../SitePages/PageName_EN.aspx" or ".../SitePages/PageName_DE.aspx". So, if the URL contains "_DE." or "_EN.", the corresponding SharePoint locale is overwritten by DE or EN.

Same is true for SharePoint translations, which were added quite recently to SPO. The URL is checked for a language string, e.g. "/de/" or "/en/" which normally appears directly behind "/SitePages/". Some languages are already supported: DE, EN, NL, FR, IT, SI, HU. Additional ones could be added in the source code quite easily. Or someone has an idea, how to detect the pages language using SPFx APIs or parse the language in the URL and determine the correct local code. Open for suggestions...

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

Within your response texts, you can embed values from the "internal variables". The following response embeds the "internal variable" named "UserName".
```
"Response": {
    "Text": {
        "default": "Hello {{UserName}}.",
        "de-de": "Hallo {{UserName}}."
    },
    "HighlightResponse": true,
}
```

Optionally, set "HighlightResponse" to true, if you'd like to highlight your response in the conversation.

Continue reading to learn about "internal variables".

### Questions
Questions are asked by the bot and answered by the user. The decision on how the conversation proceeds is made by "AnswerGoto" or "AnswerValue" in combination with Decision Conversation Items. Questions can also be used to collect data from the user that can be processed in a backend webservice; see HttpRequestActions. If you don't use "GotoAnswer", multiple questions can be asked in a row.

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
* **Key**: Each question should have a Key to uniquely identify it. The user's answer to the questions also will be stored in an "internal variable" identified by the question key. That "internal variables" become important for Decision Conversation Items and HttpRequestActions as described later. For now, just keep in mind that the user's answer is stored.
* **Text**: That is the text, that is chatted to the user. As described above, you can use different texts for different locales.
* **OptionType**: "Button", "Text" or "EMail" are currently supported. "Button" displays buttons for options - as described above. "Text" and "EMail" display a single-line text field. "Text" allows arbitrary text. "EMail" sets the input element's type to "email".
* **Options**: Only applicable if using "OptionType" "Button". An array of options for the user to choose from. Each option is rendered as a button and has again the following properties. You should as least have two options and even more are perfectly fine. Just keep in mind, that each option is rendered as a button and you don't want to overwelm the user.
  * **ButtonText**: Displayed on the button itself.
  * **AnswerText**: Displayed in the user's chat message, after a button was clicked and the question has been answered.
  * **AnswerValue**: The string stored in the "internal variable" if this answer has been choosen by the user. It then can be used in decisions to change the path of the conversation. It is optional, if "AnswerGoto" is used and nothing shall be stored in the "internal variables".
  * **AnswerGoto**: Provide the key of another conversation item. If this answer has been choosen by the user, the engine directly jumps to that item. No need of adding a decision conversation item to directly goto another response or question.

The sample above looks as follows
* unanswered
![Screenshot of an unanswered question](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_Question_unanswered.png)
* answered
![Screenshot of an answered question](https://github.com/gswdn/CobaBot/blob/master/Assets/Docu_Question_answered.png)

#### Example for EMail:

```
"Question": {
    "Key": "UsersEMailAddress",
    "Text": {
        "default": "What's your email address?",
        "de-de": "Wie lautet Deine E-Mail Adresse?"
    },
    "OptionType": "EMail"
}
```

"OptionType": "Text" is also possible. "Options" part must be skipped for "Text"/"EMail" items.

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

Decisions can also be used to react to backend webservices responses. Continue reading to learn about "HttpRequestActions" :)

### HttpRequestActions
An HttpRequestAction can be used to reach out to a webservice in order to leverage the power of backend logic. 

The HttpRequestAction item has the following parameters:

* **Key**: As every conversation item, the HttpRequestAction also should have a key. The key is also used to "group" the webservice's response into the "internal variables" as described below.
* **Url**: This URL is called as part of the HttpRequestAction.

When the conversation item is reached, the given URL is called with an HTTP POST request. All user answers in our "internal variables" collected so far (see Questions and Decisions) are passed to the webservice as part of the request body in JSON key-value format. The key of the respective Question Conversation Item is used as the key for the key-values list. The value is the user's answer to that question. Wired? Continue reading and see the example below.

After the webservice has processed the request, it has to return a JSON key-value list again. The list is merged into the "internal variables" list. Each key from the webservice's response is prefixed by the key of the HttpRequestAction and a dot.

Example:

```
{
    "Conversation": [
        {
            "Question": {
                "Key": "YourCityName",
                "Text": {
                    "default": "What's your city's name?",
                    "de-de": "Wie lautet der Name Deiner Stadt?"
                },
                "OptionType": "Text"
            }
        },
        {
            "HttpRequestAction": {
                "Key": "WeatherForecast",
                "Url": "https://cobabot-test.azurewebsites.net/api/GetWeatherForecast"
            }
        }
    ]
}
```

After the question, an "internal variable" named "YourCityName" contains the user's response, e.g. "Düsseldorf".
The webservice with the URL "https://cobabot-test.azurewebsites.net/api/GetWeatherForecast" is called with the following JSON in the body of a HTTP POST request:
```
{ "YourCityName": "Düsseldorf" }
```

The webservice looks outside the window and responds with the following JSON in the response body:
```
{ 
    "Temperature": "23° C",
    "Condition": "sunny",
    "Humidity": "42%"
}
```

This result is merged into the "internal variables" list, so it looks as follows:

Name | Value
--- | ---
YourCityName | Düsseldorf
WeatherForecast.Temperature | 23° C
WeatherForecast.Condition | sunny
WeatherForecast.Humidity | 42%

Afterwards, you can use the response in Decisions or Responses.

_Important hint:_ When calling webservices hosted under a different domain than the domain of the webpart (as it is the case when hosting the webpart on "https://yourname.sharepoint.com" and hosting your Azure Function Webservice on "https://cobabot-test.azurewebsites.net"), you need to add "https://yourname.sharepoint.com" to the allowed origins in the function's CORS settings.

## Version History

### 1.0.0
Initial Version

### 2.0.0
* using "internal variables" in response texts
* introduced text/email questions
* added HttpRequests to leverage the power of backend webservices
* visual improvements: "rounded corners" for buttons (as with the updated SharePoint design) and other small things

### 2.0.1
* Bugfix; "internal variables" were not serialized and passed correctly to in HttpRequests's body.

### 2.0.2
* Bugfix; clear "internal variables" with HttpAction-Prefix before sending action again

### 2.0.3
* Bugfix: moved top right menu icons (restart conversation, undo last step etc.) into visible area again. At least, on real pages. In workbench, it's ugly now. But real pages count. No clue, what MS changed. Suddenly, the top right menu icons were out of the webpart area.

### 3.0.0
* Improvement: added "HighlightResponse" to highlight responses
* Improvement: added "AnswerGoto" for Button Questions to directly goto another item without adding a decision item

### 3.1.0
* Improvement: highlighted speaking-bubble did not look nice
* Improvement: detect certain languages for translations

### 3.1.1
* bugfix: speaking bubbles
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