import * as vscode from "vscode";
import { MessageType } from "./messageTypes";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";

export class USFMProvider implements vscode.CustomTextEditorProvider {
  private _webview: vscode.Webview | undefined;
  private _context: vscode.ExtensionContext | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new USFMProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      USFMProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  static readonly viewType = "textTranslation";

  constructor(private readonly context: vscode.ExtensionContext) {
    this._context = context;
    this._registerCommands();
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // globalStateEmitter.on(
    //   "chapterSelected",
    //   ({ key, value }: { key: string; value: ChapterRefGLobalState }) => {
    //     if (webviewPanel.visible && key === "chapterRef") {
    //       console.log("chapter state changes", value);
    //       webviewPanel.webview.postMessage({
    //         type: MessageType.SCROLL_TO_CHAPTER,
    //         payload: {
    //           chapterRef: value.chapterRef,
    //         },
    //       });
    //     }
    //   }
    // );
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this._getWebviewContent(
      webviewPanel.webview,
      this.context.extensionUri
    );
    this._webview = webviewPanel.webview;

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        payload: {
          doc: document.getText(),
        },
      });
    }

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

    const didTabsChanged = vscode.window.onDidChangeActiveTextEditor((e) => {
      console.log(e, "editor tab changed");
      // if (e?.document.uri.toString() === document.uri.toString()) {
      //   updateWebview();
      // }
    });
    webviewPanel.onDidDispose(() => {
      console.log("??????????????????????", "webview disposed");
      changeDocumentSubscription.dispose();
      didTabsChanged.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(
      async (e: { type: MessageType; payload: unknown }) => {
        switch (e.type) {
          case MessageType.showDialog:
            vscode.window.showInformationMessage(e.payload as string);
            return;
          // case MessageType.BLOCK_CLICK:
          //   console.log(" block click EDITOR", e.payload);
          //   return;
          default:
            break;
        }
      }
    );

    this._webview = webviewPanel.webview;

    updateWebview();
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
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
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
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _getExtensionFromPath(path: string) {
    const split = path.split(".");
    return split[split.length - 1];
  }

  private async _openFile(path: string) {
    // const uri = vscode.Uri.file(path);
    // await vscode.commands.executeCommand(
    //   "vscode.openWith",
    //   uri,
    //   this._getExtensionFromPath(path) === "usfm"
    //     ? USFMProvider.viewType
    //     : "default",
    //   vscode.ViewColumn.Beside
    // );
    // vscode.commands.executeCommand("vscode.open", uri);
    // vscode.window.showTextDocument(doc, {
    //   viewColumn: vscode.ViewColumn.Beside,
    // });
    console.log(path, "file should be opened here");
  }
}
