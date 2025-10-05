import fs from 'fs-extra';
import { Logger } from '$logger';
import { toOsPath } from '$utils/toOsPath';
const logger = new Logger("readFilesRecursive");
const { logFatalAndThrow } = logger;

/** 
 * Reads all files in a given directory.
 * 
 * Returns an array of file paths relative to given directory.
 */
export function readFilesRecursive(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
        logFatalAndThrow({
            msg: `failed to read files recursively: directory path doesn't exist: ${dirPath}`,
        });
    }

    if (!fs.statSync(dirPath).isDirectory) {
        logFatalAndThrow({
            msg: `failed to read files recursively: given path is a file path, not a directory path: ${dirPath}`,
        });
    }

    const result: string[] = [];
    for (const relPathRaw of fs.readdirSync(dirPath, { recursive: true })) {
        const relPath = relPathRaw.toString('utf-8');

        const absSourceFilePath = toOsPath(`${dirPath}/${relPath}`);
        if (fs.statSync(absSourceFilePath).isDirectory()) {
            continue;
        }

        result.push(relPath.toString());
    }

    return result;
}