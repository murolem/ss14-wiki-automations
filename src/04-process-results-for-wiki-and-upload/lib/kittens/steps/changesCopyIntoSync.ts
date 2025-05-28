import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { projectDirpaths, projectStepDirpaths, projectWikiOutputs, wikiAutomationsRepo, type Project } from '$src/preset';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
const logger = new Logger("wiki/kittens/copyChangesFromProcessing");
const { logInfo, logFatal } = logger;

/** 
 * Copies changes over from the processing step (if any).
 */
export async function changesCopyIntoSync() {
    logInfo("copying changes from processing step");

    const projectWikiOutputsKeys = Object.keys(projectWikiOutputs);
    for (let projectI = 0; projectI < projectWikiOutputsKeys.length; projectI++) {
        const project = projectWikiOutputsKeys[projectI];
        const projectDiffDirpath = path.join(projectDirpaths.diff, project);
        ensureDirectoryExistsAndEmpty(projectDiffDirpath);

        logInfo(`[proj ${projectI + 1} of ${projectWikiOutputsKeys.length}] project ${chalk.bold(project)}`);

        const projectOutputs = projectWikiOutputs[project as keyof typeof projectWikiOutputs];
        const projectOutputsKeys = Object.keys(projectOutputs);
        for (let projectOutputI = 0; projectOutputI < projectOutputsKeys.length; projectOutputI++) {
            const projectOutputKey = projectOutputsKeys[projectOutputI];

            logInfo(`[out ${projectOutputI + 1} of ${projectOutputsKeys.length}] output ${chalk.italic(projectOutputKey)}`);

            const output = projectOutputs[projectOutputKey as keyof typeof projectOutputs];
            const fullFilepath = path.join(projectStepDirpaths[project as Project].wiki_upload, output.filepath);
            if (!fs.existsSync(fullFilepath)) {
                logInfo(chalk.gray("❌ not found, at: " + fullFilepath));
                continue;
            }

            const diffDirFilepath = path.join(projectDiffDirpath, output.filepath);
            fs.ensureDirSync(path.parse(diffDirFilepath).dir);
            fs.copyFileSync(fullFilepath, diffDirFilepath);

            logInfo(`✅ copied! ${chalk.gray("to: " + diffDirFilepath)}`);
        }
    }
}