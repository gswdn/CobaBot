## What is guerilla-coba-bot

CobaBot is a very simple chatbox, especially designed for simple chats that follow a so called decision tree.
The bot asks questions, that are answered by the user. Depending on the answer, different responses and additional questions are possible.
CobaBot is a SharePoint SPFx webpart, so no additional infrastrucutre is required.
The conversation is based on a so called conversation template (JSON/YAML), that defines questions, responses and decisions.

Sample - Initial Screen:

Sample - A few questions answered:

## Just wanna use it?
The latest stable package can be found in the "Package" subfolder here on GitHub.
* Download the file
* Create an App Catalog for your SharePoint Online Tenant 
* Upload the "guerilla-coba-bot.sppkg" file and deploy the solution
* If the app is not deployed tenant-wide, you have to add the app to the SiteCollection, where you'd like to use it.
* Edit a page and add the CobaBot WebPart

## Conversation template details
### basics

CobaBot follows a conversation based on a template ("ConversationTemplate").

The template is set as JSON in the webpart properties. I prefer to write the Conversation Template as YAML and convert it to JSON. In a later version, it's planned that YAML can directly be set in the properties.

#### concept

The Conversation Template defines the conversation, that means: Responses, Questions, and Decisions. We name them Conversation Items.
Each Conversation Item should have a key to uniquely identify it. This gets important for jumping to a particular Conversation Item.

Responses are just written chat messages from the bot.
Questions are something, the bot asks. You can define possible answers, that will be presented as buttons.
Depending on the user's answer, a decision is made, what means: go to another Conversation Item identified by the unique key.

#### localization

### Responses

### Questions

### Decisions

## For contributors

### Building the code

If you're already prepared for SPFx development
* git clone the repo
* npm install
* gulp

### local serving and testing
gulp serve


### Prepare Package

#### tests
Must be done manually, still.
Test in Chrome and Internet Explorer.
IE is still used out there and it really behaves differently.

#### creating the package
* gulp clean
* gulp build
* gulp bundle --ship
* gulp package-solution --ship
