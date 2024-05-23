import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import { MessageType } from "./messageTypes";
import USFMParser from "sj-usfm-grammar";

export class USFMEditorProvider implements vscode.CustomTextEditorProvider {
  private _webview: vscode.Webview | undefined;
  private _context: vscode.ExtensionContext | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new USFMEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      USFMEditorProvider.viewType,
      provider
      // {
      //   webviewOptions: {
      //     retainContextWhenHidden: true,
      //   },
      // }
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

    // function updateWebview() {
    //   webviewPanel.webview.postMessage({
    //     type: "update",
    //     payload: {
    //       usfm: document.getText(),
    //     },
    //   });
    // }

    const updateWebview = async () => {
      console.log("updating webview first call");
      const usj =
        this.context.workspaceState.get(document.uri.toString()) ??
        (await this.convertUsfmToUsj(document.getText()));
      if (usj) {
        this.context.workspaceState.update(document.uri.toString(), usj);
        webviewPanel.webview.postMessage({
          type: "update",
          payload: { usj },
        });
      }
    };

    webviewPanel.onDidChangeViewState((e) => {
      console.log("VIEW CHANGED");
      if (e.webviewPanel.active) {
        updateWebview();
      }
    });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          // updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case MessageType.updateDocument: {
          console.log("updating document", e.payload?.usj);
       
       
          // const edit = new vscode.WorkspaceEdit();

          // // this.updateDocument(document, e.payload?.usfm as string);
          // edit.replace(
          //   document.uri,
          //   new vscode.Range(0, 0, document.lineCount, 0),
          //   e.payload?.usfm as string
          // );

          
          // async function applyEditWithCursorPosition(
          //   edit: vscode.WorkspaceEdit
          // ) {
          //   console.log("applying edit with cursor position");
          //   const activeEditor = vscode.window.activeTextEditor;

          //   if (activeEditor) {
          //     // Save the current cursor position
          //     const cursorPosition = activeEditor.selection.active;

          //     // Apply the edit
          //     const editResult = await vscode.workspace.applyEdit(edit);

          //     if (editResult) {
          //       // Restore the cursor position
          //       const newSelection = new vscode.Selection(
          //         cursorPosition,
          //         cursorPosition
          //       );
          //       activeEditor.selection = newSelection;
          //       activeEditor.revealRange(newSelection);
          //     }
          //   }
          // }
          // vscode.workspace.applyEdit(edit);
          // applyEditWithCursorPosition(edit);
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
  private async convertUsfmToUsj(usfm: string) {
    console.log("parsing usfm");
    await USFMParser.init();
    const usfmParser = new USFMParser();
    const usj = usfmParser.usfmToUsj(usfm);
    return usj;
  }
}
