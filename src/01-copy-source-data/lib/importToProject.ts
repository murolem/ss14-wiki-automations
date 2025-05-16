import { projectDirpaths, projectStepDirpaths, stepDirnames, type Project } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
import chalk from 'chalk';
import { ensureDirectoryExistsEmpty } from '$utils/ensureDirectoryExistsEmpty';

const logger = new Logger("import/importToProject");
const { logInfo, logFatal } = logger;

/**
 * Copies given path (file or dir, relative to the SS14 repo directory) to the input step dir inside the given project dirname.
 * 
 * If the step directory is non-empty, clears it.
 * If it doesn't exist, creates it.
 * 
 * @param ss14Path Source path relative to the SS14 repo directory.
 * @param project Project name.
 * @throws {Error} If {@link ss14Path} path doesn't exist.
 * @throws {Error} If {@link targetPath} is a file.
 */
export function importToProject(ss14Path: string, project: Project): void {
    const sourcePath = toOsPath(`${projectDirpaths.ss14_repo}/${ss14Path}`);
    const targetPath = projectStepDirpaths[project].input;

    logInfo(`copy ${chalk.bold(ss14Path)} to project ${chalk.bold(project)}`);

    if (!fs.existsSync(sourcePath)) {
        logFatal({
            msg: "failed to import to project: source path doesn't exist",
            throw: true,
            data: {
                sourcePath
            }
        });
    }

    ensureDirectoryExistsEmpty(targetPath);
    fs.copySync(sourcePath, targetPath);
}