import * as vscode from "vscode";
import {
  getMd5Hash,
  isCacheValid,
  readCache,
  writeCache,
  deleteOldCacheFile,
  getCacheMap,
  updateCacheMap,
} from "./cacheUtils";
import { convertUsfmToUsj } from "./conversionUtils";

export async function cacheUSFMtoUSJ(context: vscode.ExtensionContext) {
  try {
    let loaded = 0;
    const files = await vscode.workspace.findFiles(
      // "resources/**",
      "ingredients/*.usfm"
    );
    await Promise.all(
      files.map(async (file) => {
        try {
          const document = await vscode.workspace.openTextDocument(file);
          const text = document.getText();
          const { usj, error } = await handleCache(file.fsPath, text, context);
          !error && loaded++;
        } catch (error) {
          console.error(`Error processing file ${file.fsPath}: ${error}`);
        }
      })
    );

    vscode.window.showInformationMessage(
      `Successfully loaded ${loaded}/${files.length} USFM files in the project!`
    );
  } catch (error) {
    console.error(`Error loading documents: ${error}`);
  }
}

async function handleCache(
  filePath: string,
  usfmContent: string,
  context: vscode.ExtensionContext
): Promise<any> {
  const newHash = getMd5Hash(usfmContent);
  const cacheMap = getCacheMap(context);
  const oldHash = cacheMap[filePath];

  if (oldHash && isCacheValid(oldHash) && oldHash === newHash) {
    // Cache hit with the old hash
    console.log("Intialize Cache hit");
    return { usj: await readCache(oldHash) };
  } else {
    // Cache miss or content changed
    console.log("Initialize Cache miss");
    if (oldHash) {
      deleteOldCacheFile(oldHash);
    }
    const { usj, error } = await convertUsfmToUsj(usfmContent);
    if (error) {
      console.error("Error parsing USFM", error);
      return { error };
    }
    writeCache(newHash, usj);
    updateCacheMap(context, filePath, newHash);
    return { usj };
  }
}
