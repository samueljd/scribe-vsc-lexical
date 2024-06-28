# scribe-lexical-vsc 

## Installation

Clone this repo and run `npm install` to install the dependencies.
cd into the `webviews` directory and run `npm install` && `npm run build` to build the extension webview.
Then run `npm run watch` to start the development server.
Now press `F5` to start the extension in the development mode.

## Usage

In the extension host that opens open a text translaion scripture burrito.
Select USFM editor on the activity bar.
A webview panel should load all the available books in the `ingredients` directory. Clicking on one will trigger the webview to load the book in the lexical editor.
Clicking on any verse will update the extension with its latest reference.
