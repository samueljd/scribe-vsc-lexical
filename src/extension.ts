import * as vscode from "vscode";
import { fileExists, isProjectUSFM } from "./utilities/usfm";
// import { USFMEditorProvider } from "./providers/USFMEditor";
import { USFMEditorProvider } from "./providers/cacheTest2";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "scribe-xelah" is now active!');
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

  const currentProjectURI = vscode.workspace.workspaceFolders?.[0].uri;

  if (!currentProjectURI) {
    vscode.window.showWarningMessage("No workspace opened");
  }

  const metadataFileUri = currentProjectURI?.with({
    path: vscode.Uri.joinPath(currentProjectURI, "metadata.json").path,
  });

  context.subscriptions.push(USFMEditorProvider.register(context));
  context.subscriptions.push(
    // vscode.workspace.onWillSaveTextDocument(event => {
    //     console.log(`Document ${event.document.uri} is about to be saved.`);

    //     // Perform any actions before the document is saved
    //     // Example: Add a timestamp to the document
    //     const edit = new vscode.WorkspaceEdit();
    //     const timestamp = `// Last saved: ${new Date().toISOString()}\n`;
    //     edit.insert(event.document.uri, new vscode.Position(0, 0), timestamp);

    //     event.waitUntil(Promise.resolve([edit]));
    // })
    vscode.workspace.onWillSaveTextDocument(async (e) => {
      const document = e.document;
      const usj = this.context.workspaceState.get(document.uri.toString());
  
      if (usj) {
          const editor = vscode.window.activeTextEditor;
          let cursorPosition;
  
          if (editor && editor.document === document) {
              cursorPosition = editor.selection.active;
          }
  
          const usfm = await this.convertUsjToUsfm(usj); // Await the asynchronous conversion function
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), usfm);
  
          await vscode.workspace.applyEdit(edit);
  
          // Restore cursor position
          if (editor && cursorPosition) {
              const newSelection = new vscode.Selection(cursorPosition, cursorPosition);
              editor.selection = newSelection;
          }
      }
  });
  
);
}

export function deactivate() {}
