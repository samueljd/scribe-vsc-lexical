import * as vscode from "vscode";
import { fileExists, isProjectUSFM } from "./utilities/usfm";
// import { USFMEditorProvider } from "./providers/USFMEditor";
import { USFMEditorProvider } from "./providers/test";

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
}

export function deactivate() {}
