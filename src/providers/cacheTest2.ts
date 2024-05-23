import * as vscode from "vscode";
import USFMParser from "sj-usfm-grammar";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import { MessageType } from "./messageTypes";
import {
  getMd5Hash,
  isCacheValid,
  readCache,
  writeCache,
  deleteOldCacheFile,
  getCacheMap,
  updateCacheMap,
} from "./cacheUtils";
import getUsfmParser from "./USFMParser";

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

    const updateWebview = async () => {
      console.log("Updating webview...");
      const filePath = document.uri.fsPath;
      const usfmContent = document.getText();
      const newHash = getMd5Hash(usfmContent);
      const cacheMap = getCacheMap(this.context);
      const oldHash = cacheMap[filePath];

      if (oldHash && isCacheValid(oldHash)) {
        // Cache hit with the old hash
        console.log("Cache hit");
        const usj = readCache(oldHash);
        this.context.workspaceState.update(document.uri.toString(), usj);
        webviewPanel.webview.postMessage({
          type: "update",
          payload: { usj },
        });
      } else {
        // Cache miss or content changed
        console.log("Cache miss or content changed");
        if (oldHash) {
          deleteOldCacheFile(oldHash);
        }
        const usj = await this.convertUsfmToUsj(usfmContent);
        writeCache(newHash, usj);
        updateCacheMap(this.context, filePath, newHash);
        this.context.workspaceState.update(document.uri.toString(), usj);
        webviewPanel.webview.postMessage({
          type: "update",
          payload: { usj },
        });
      }
    };

    webviewPanel.onDidChangeViewState((e) => {
      console.log("View changed");
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
          console.log("Updating document", e.payload?.usj);
          // const edit = new vscode.WorkspaceEdit();
          // edit.replace(
          //     document.uri,
          //     new vscode.Range(0, 0, document.lineCount, 0),
          //     e.payload?.usfm as string
          // );
          // vscode.workspace.applyEdit(edit);
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
  private async markDocumentAsDirty(
    document: vscode.TextDocument
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const editor = vscode.window.activeTextEditor;

    if (editor && editor.document === document) {
      const cursorPosition = editor.selection.active;

      edit.replace(document.uri, new vscode.Range(0, 0, 0, 0), ""); // A no-op edit to mark as dirty
      await vscode.workspace.applyEdit(edit);

      // Restore cursor position
      const newSelection = new vscode.Selection(cursorPosition, cursorPosition);
      editor.selection = newSelection;
    } else {
      edit.replace(document.uri, new vscode.Range(0, 0, 0, 0), ""); // A no-op edit to mark as dirty
      await vscode.workspace.applyEdit(edit);
    }
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
    const usfmParser = await getUsfmParser();
    const usj = usfmParser.usfmToUsj(usfm);
    return usj;
  }

  private async convertUsjToUsfm(usj: JSON) {
    console.log("parsing usj");
    const usfmParser = await getUsfmParser();
    const usfm = usfmParser.Usj2Usfm(usj);
    return usfm;
  }
}
