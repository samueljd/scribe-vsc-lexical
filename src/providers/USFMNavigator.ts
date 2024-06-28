import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { MessageType } from "./messageTypes";
import { getOrderedBooks, BookPayload } from "../utilities/verseData";

export class USFMNavigator implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private _context: vscode.ExtensionContext;
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new USFMNavigator(context);
    const providerRegistration = vscode.window.registerWebviewViewProvider(
      USFMNavigator.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "scribe-lexical.usfm-navigator";

  constructor(private readonly context: vscode.ExtensionContext) {
    this._context = context;
    this._registerCommands();
  }
  public getFileNames = async () => {
    // of  usfm files available in the current workspace
    const workspaceUri = vscode.workspace.workspaceFolders?.[0].uri;
    if (!workspaceUri) {
      return [];
    }
    const folderUri = vscode.Uri.joinPath(workspaceUri, "ingredients");
    const folder = await vscode.workspace.fs.readDirectory(folderUri);
    const filteredFiles = folder.filter(([fileName]) => {
      return fileName.endsWith(`.${"usfm"}`);
    });
    return getOrderedBooks(
      filteredFiles.map(([fileName]) => fileName.split(".")[0])
    );
  };

  public async resolveWebviewView(
    webviewPanel: vscode.WebviewView,
    ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this._getWebviewContent(
      webviewPanel.webview,
      this.context.extensionUri
    );
    // webviewPanel.webview.onDidReceiveMessage(async (message) => {
    //   switch (message.command) {
    //     case "sendMessage":
    //       vscode.commands.executeCommand(
    //         "extension.sendMessageToEditor",
    //         message.text
    //       );
    //       break;
    //   }
    // });

    // vscode.commands.registerCommand(
    //   "extension.sendMessageToNavigator",
    //   (text: string) => {
    //     webviewPanel.webview.postMessage({ command: "receiveMessage", text });
    //   }
    // );

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(
      async (e: { type: MessageType; payload: unknown }) => {
        switch (e.type) {
          case MessageType.OPEN_USFM_FILE:
            if (!vscode.workspace.workspaceFolders?.length) {
              return vscode.window.showErrorMessage("No workspace opened");
            }
            console.log(e.payload, "e.payload");
            if (!(e.payload as BookPayload).fileName) {
              return vscode.window.showErrorMessage("No file name provided");
            }
            const bookUri = vscode.Uri.joinPath(
              vscode.workspace.workspaceFolders?.[0].uri,
              "ingredients",
              `${(e.payload as BookPayload).fileName}`.toUpperCase() + ".usfm"
            );
            try {
              await vscode.commands.executeCommand(
                "vscode.openWith",
                bookUri,
                "scribe-lexical-vsc.scribeLexicalEditor"
              );
            } catch (error) {
              vscode.window.showErrorMessage(`Error opening file: ${error}`);
            }
            break;
          case MessageType.SEND_BOOKS_IN_WORKSPACE:
            webviewPanel.webview.postMessage({
              type: MessageType.BOOKS_IN_WORKSPACE_RESPONSE,
              payload: await this.getFileNames(),
            });
            break;
          default:
            break;
        }
      }
    );
    vscode.commands.registerCommand('extension.sendMessageToNavigator', (text: any) => {
      webviewPanel.webview.postMessage({ type: MessageType.RECEIVE_MESSAGE, payload: text });
    });

    // webview.panel.onDidChangeViewState((e) => {});

    this._webviewView = webviewPanel;
  }

  public revive(panel: vscode.WebviewView) {
    this._webviewView = panel;
  }

  private async _registerCommands() {
    const commands: {
      command: string;
      title: string;
      handler: (...args: any[]) => any;
    }[] = [];

    const registeredCommands = await vscode.commands.getCommands();

    commands.forEach((command) => {
      if (!registeredCommands.includes(command.command)) {
        this._context?.subscriptions.push(
          vscode.commands.registerCommand(command.command, command.handler)
        );
      }
    });
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webviews",
      "build",
      "assets",
      "index.css",
    ]);
    // The View JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webviews",
      "build",
      "assets",
      "views",
      "BibleNavigator.js",
    ]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Sidebar vscode obs extension</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
