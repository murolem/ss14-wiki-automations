import { projectDirpaths, projectStepDirpaths, wikiStepOutputs, type Project } from '$src/preset';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
const logger = new Logger("wiki/kittens/changesCopyIntoSync");
const { logDebug, logInfo, logFatalAndThrow } = logger;

/** 
 * Copies changes over from the processing step (if any).
 */
export async function changesCopyIntoSync() {
    logInfo("copying changes from processing step into diff");

    const projects = [...new Set(wikiStepOutputs.map(e => e.project))];
    for (const project of projects) {
        const projectOutputs = wikiStepOutputs
            .filter(e => e.project === project && e.wikipage);
        if (projectOutputs.length === 0)
            continue;

        const projectDiffAbsDirpath = path.join(projectDirpaths.diff, project);
        ensureDirectoryExistsAndEmpty(projectDiffAbsDirpath);

        for (const output of projectOutputs) {
            logInfo(`searching for project ${chalk.bold(project)} output ${chalk.bold(output.name)}`);

            const wikiAbsFilepath = path.join(projectStepDirpaths[project as Project].wiki_upload, output.relFilepath);
            if (!fs.existsSync(wikiAbsFilepath)) {
                logInfo("❌ output not found");
                logDebug("expected at: " + wikiAbsFilepath);
                continue;
            }

            const outputFilepathInDiffDir = path.join(projectDiffAbsDirpath, output.relFilepath);
            fs.ensureDirSync(path.parse(outputFilepathInDiffDir).dir);
            fs.copyFileSync(wikiAbsFilepath, outputFilepathInDiffDir);

            logInfo(`✅ output copied!`);
            logDebug("to: " + outputFilepathInDiffDir);
        }
    }
}