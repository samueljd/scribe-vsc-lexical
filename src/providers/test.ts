import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import { MessageType } from "./messageTypes";

export class USFMEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = "scribe-lexical-vsc.scribeLexicalEditor";
  private webviewPanels = new Map<string, vscode.WebviewPanel>();

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new USFMEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      USFMEditorProvider.viewType,
      provider
    );

    context.subscriptions.push(provider);
    context.subscriptions.push(
      vscode.workspace.onWillSaveTextDocument((event) => {
        console.log("hooked will saving document");
        if (event.document.uri.scheme === "file") {
          event.waitUntil(provider.saveDocument(event.document));
        }
      })
    );

    return providerRegistration;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Store the webview panel reference
    this.webviewPanels.set(document.uri.toString(), webviewPanel);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      this.context.extensionUri
    );

    const updateWebview = () => {
      webviewPanel.webview.postMessage({
        type: "update",
        payload: {
          usfm: document.getText(),
        },
      });
    };

    webviewPanel.onDidChangeViewState((e) => {
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

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      this.webviewPanels.delete(document.uri.toString());
    });

    // Receive message from the webview
    webviewPanel.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case MessageType.updateDocument:
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            message.payload?.usfm as string
          );
          async function applyEditWithCursorPreservation(edit :vscode.WorkspaceEdit) {
            console.log("applying edit with cursor position")
            const activeEditor = vscode.window.activeTextEditor;
        
            if (activeEditor) {
                // Save the current cursor position
                const cursorPosition = activeEditor.selection.active;
        
                // Apply the edit
                const editResult = await vscode.workspace.applyEdit(edit);
        
                if (editResult) {
                    // Restore the cursor position
                    const newSelection = new vscode.Selection(cursorPosition, cursorPosition);
                    activeEditor.selection = newSelection;
                    activeEditor.revealRange(newSelection);
                }
            }
        }
          // vscode.workspace.applyEdit(edit);
          applyEditWithCursorPreservation(edit);
          break;
        // case MessageType.save: {
        //   const edit = new vscode.WorkspaceEdit();
        //   edit.replace(
        //     document.uri,
        //     new vscode.Range(0, 0, document.lineCount, 0),
        //     message.payload.usfm
        //   );
        //   vscode.workspace.applyEdit(edit).then(() => {
        //     document.save();
        //   });
        // }
      }
    });

    updateWebview();
  }

  // public async saveDocument(document: vscode.TextDocument): Promise<void> {
  //   console.log("hooked saving document");
  //   const webviewPanel = this.webviewPanels.get(document.uri.toString());
  //   if (webviewPanel) {
  //     webviewPanel.webview.postMessage({ type: MessageType.updateDocument });

  //     return new Promise<void>((resolve) => {
  //       const messageListener = (message: any) => {
  //         if (message.type === MessageType.save) {
  //           const edit = new vscode.WorkspaceEdit();
  //           edit.replace(
  //             document.uri,
  //             new vscode.Range(0, 0, document.lineCount, 0),
  //             message.payload.usfm
  //           );
  //           vscode.workspace.applyEdit(edit).then(() => {
  //             document.save().then(() => resolve());
  //           });
  //         }
  //         webviewPanel.webview.onDidReceiveMessage(messageListener);
  //       };
  //     });
  //   }
  // }

  public async saveDocument(document: vscode.TextDocument): Promise<void> {
    const webviewPanel = this.webviewPanels.get(document.uri.toString());
    if (webviewPanel) {
      webviewPanel.webview.postMessage({ type: 'requestSaveData' });

      return new Promise<void>((resolve, reject) => {
        const messageListener = (message: any) => {
          if (message.type === 'save') {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), message.payload.usfm);
            vscode.workspace.applyEdit(edit).then(() => {
              document.save().then(resolve).catch(reject);
            }).catch(reject).finally(() => {
              webviewPanel.webview.onDidReceiveMessage(() => {}); // Remove listener
            });
          }
        };

        webviewPanel.webview.onDidReceiveMessage(messageListener);
      });
    } else {
      return Promise.resolve(); // No webview panel found, resolve immediately
    }
  }

  public dispose(): void {
    this.webviewPanels.forEach((panel) => panel.dispose());
    this.webviewPanels.clear();
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    const stylesUri = getUri(webview, extensionUri, [
      "webviews",
      "build",
      "assets",
      "index.css",
    ]);
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
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Translation Questions Webview</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }

  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2)
    );

    return vscode.workspace.applyEdit(edit);
  }
}
