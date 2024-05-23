import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as crypto from "crypto";
import USFMParser from "sj-usfm-grammar";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import { MessageType } from "./messageTypes";

const CACHE_DIR = path.join(
  getWorkspaceFolderPath() || "",
  "usj_cache"
);
// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getMd5Hash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

function getCacheFilePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

function isCacheValid(hash: string): boolean {
  const cacheFilePath = getCacheFilePath(hash);
  return fs.existsSync(cacheFilePath);
}

function readCache(hash: string): any {
  const cacheFilePath = getCacheFilePath(hash);
  return JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
}

function writeCache(hash: string, data: any): void {
  const cacheFilePath = getCacheFilePath(hash);
  fs.writeFileSync(cacheFilePath, JSON.stringify(data), "utf8");
}
function getWorkspaceFolderPath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
}

function deleteCache(hash: string): void {
  const cacheFilePath = getCacheFilePath(hash);
  if (fs.existsSync(cacheFilePath)) {
      fs.unlinkSync(cacheFilePath);
  }
}


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
      const usfmContent = document.getText();
      const hash = getMd5Hash(usfmContent);

      let usj: any;
      if (isCacheValid(hash)) {
        usj = readCache(hash);
        console.log("Cache hit");
      } else {
        console.log("Cache miss");
        usj = await this.convertUsfmToUsj(usfmContent);
        writeCache(hash, usj);
      }

      if (usj) {
        // this.context.workspaceState.update(document.uri.toString(), usj);
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
          //   document.uri,
          //   new vscode.Range(0, 0, document.lineCount, 0),
          //   e.payload?.usfm as 
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
    console.log("Parsing USFM");
    await USFMParser.init();
    const usfmParser = new USFMParser();
    const usj = usfmParser.usfmToUsj(usfm);
    return usj;
  }
}
