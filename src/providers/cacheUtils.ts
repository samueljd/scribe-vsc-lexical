import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as crypto from 'crypto';

const CACHE_DIR = path.join(
    getWorkspaceFolderPath() || '',
    '.vscode',
    'usj_cache'
);

const CACHE_MAP_KEY = 'fileCacheMap'; // Key to store the cache mapping in the context

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    console.log('Creating cache directory:', CACHE_DIR)
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function getMd5Hash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

export function getCacheFilePath(hash: string): string {
    return path.join(CACHE_DIR, `${hash}.json`);
}

export function isCacheValid(hash: string): boolean {
    const cacheFilePath = getCacheFilePath(hash);
    return fs.existsSync(cacheFilePath);
}

export function readCache(hash: string): any {
    const cacheFilePath = getCacheFilePath(hash);
    return JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
}

export function writeCache(hash: string, data: any): void {
    const cacheFilePath = getCacheFilePath(hash);
    fs.writeFileSync(cacheFilePath, JSON.stringify(data), 'utf8');
}

export function deleteOldCacheFile(hash: string): void {
    const cacheFilePath = getCacheFilePath(hash);
    if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath);
    }
}

export function getCacheMap(context: vscode.ExtensionContext): { [key: string]: string } {
    return context.workspaceState.get(CACHE_MAP_KEY, {});
}

export function updateCacheMap(context: vscode.ExtensionContext, filePath: string, hash: string): void {
    const cacheMap = getCacheMap(context);
    cacheMap[filePath] = hash;
    context.workspaceState.update(CACHE_MAP_KEY, cacheMap);
}

function getWorkspaceFolderPath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
}
