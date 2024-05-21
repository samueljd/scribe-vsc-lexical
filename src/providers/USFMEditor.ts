import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import { MessageType } from "./messageTypes";

export class USFMEditorProvider implements vscode.CustomTextEditorProvider {
  private _webview: vscode.Webview | undefined;
  private _context: vscode.ExtensionContext | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new USFMEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      USFMEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "scribe-lexical-vsc.scribeLexicalEditor";

  constructor(private readonly context: vscode.ExtensionContext) {
    this._context = context;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      this.context.extensionUri
    );

    function updateWebview() {
      console.log("reading document", document.getText());
      webviewPanel.webview.postMessage({
        type: "update",
        payload: {
          usfm: document.getText(),
        },
      });
    }

    webviewPanel.onDidChangeViewState((e) => {
      console.log("VIEW CHANGED");
      if (e.webviewPanel.active) {
        updateWebview();
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case MessageType.save: {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            e.payload?.usfm as string
          );
          vscode.workspace.applyEdit(edit);
          return;
        }
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    // Local path to script and css for the webview
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
      "index.js",
    ]);

    const nonce = getNonce();

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>Translation Questions Webview</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }

  /**
   * Write out the json to a given document.
   */
  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2)
    );

    return vscode.workspace.applyEdit(edit);
  }
}
