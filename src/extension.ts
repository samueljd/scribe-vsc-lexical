import * as vscode from "vscode";
import { USFMEditorProvider } from "./providers/cacheTest2";
import { isProjectUSFM } from "./utilities/usfm";
import { cacheUSFMtoUSJ } from "./handlers/cacheHandler";

export async function activate(context: vscode.ExtensionContext) {
  console.log("Scribe Lexical Editor is now active!");
  context.subscriptions.push(USFMEditorProvider.register(context));

  const currentProjectURI = vscode.workspace.workspaceFolders?.[0].uri;

  if (!currentProjectURI) {
    vscode.window.showWarningMessage("No workspace opened");
  }

  const metadataFileUri = currentProjectURI?.with({
    path: vscode.Uri.joinPath(currentProjectURI, "metadata.json").path,
  });

  (async () => {
    const isCurrentProject = await isProjectUSFM(metadataFileUri);
    isCurrentProject && (await cacheUSFMtoUSJ(context));
    if (!isCurrentProject) {
      vscode.window.showWarningMessage(
        "Current project isn't a text translation"
      );
      return;
    }
  })();
}

export function deactivate() {}
