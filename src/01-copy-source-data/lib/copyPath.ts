import { stepAbsDirPaths } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
import chalk from 'chalk';

const logger = new Logger("01-copyPath");
const { logInfo, logFatal } = logger;

/**
 * Copies given path (file or dir; relative to the SS14 repo) to the source data directory
 * under the same path.
 * 
 * If an override path {@link overrideTargetPath} is provided, it will be instead used
 * as a path in the source data directory. 
 * 
 * @param ss14Path Source path relative to the SS14 repo directory.
 * @param overrideTargetPath Source data path override. By default, uses the same path.
 * @throws {Error} If path doesn't exist.
 */
export function copyPath(ss14Path: string, overrideTargetPath?: string): void {
    const sourcePath = toOsPath(`${stepAbsDirPaths.ss14Repo}/${ss14Path}`);
    const targetPath = toOsPath(`${stepAbsDirPaths.inputData}/${overrideTargetPath ?? ss14Path}`);

    logInfo(`copy ${chalk.bold(ss14Path)}`);

    if (overrideTargetPath) {
        logInfo(chalk.cyan(`^target path override to: ${chalk.bold(overrideTargetPath)}`))
    }

    if (!fs.existsSync(sourcePath)) {
        logFatal({
            msg: "failed to copy path: source path doesn't exist",
            throw: true,
            data: {
                sourcePath
            }
        });
        throw ''
    }

    if (fs.statSync(sourcePath).isDirectory()) {
        fs.ensureDirSync(targetPath);
    }

    fs.copySync(sourcePath, targetPath);
}

// /** Same as {@link copyPath}, used for paths containing JSON files. */
// export function copyJsonPath(ss14Path: string, targetInputDataPath?: string): void {

// }

// /** Same as {@link copyPath}, but used for paths containing any other files except JSON files. */
// export function copyNonJsonPath(ss14Path: string, targetInputDataPath?: string): void {

// }