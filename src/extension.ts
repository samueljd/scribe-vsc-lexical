import * as vscode from "vscode";
import { USFMEditorProvider } from "./providers/cacheTest2";

export function activate(context: vscode.ExtensionContext) {
  console.log('Scribe Lexical Editor is now active!');
  context.subscriptions.push(USFMEditorProvider.register(context));
}

export function deactivate() {}
