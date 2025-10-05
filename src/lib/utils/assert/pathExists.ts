import { Logger } from '$logger';
import fs from 'fs-extra';
const logger = new Logger("utils/assert/pathExists");
const { logFatalAndThrow } = logger;

/** 
 * Checks whether given path exists.
 * 
 * {@link errorMsg} is provided, used it for the error message.
 * @param pathStr Path to check.
 * @param errorMsg A custom error message.
 * @throws {Error} If given path doesn't exists. 
  */
export function assertPathExists(pathStr: string, errorMsg?: string): void {
    if (!fs.existsSync(pathStr)) {
        logFatalAndThrow({
            msg: errorMsg ?? `path exist assertion failed: path doesn't exist: ${pathStr}`,
            data: {
                path: pathStr
            }
        });
    }
}