import * as vscode from "vscode";
import { fileExists, isProjectUSFM } from "./utilities/usfm";
import { USFMProvider } from "./providers/usfm";

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

  (async () => {
    const isCurrentProject = await isProjectUSFM(metadataFileUri);

    vscode.commands.executeCommand(
      "setContext",
      "scribe-xelah.isProjectUSFM",
      isCurrentProject
    );

    if (!isCurrentProject) {
      vscode.window.showWarningMessage(
        "Current project isn't a text translation"
      );
      return;
    }
    // TextTranslationPanel.render(context.extensionUri, context);
  })();

  context.subscriptions.push(USFMProvider.register(context));
}
export function deactivate() {}
