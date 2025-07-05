import { projectDirpaths, projectStepDirpaths, wikiStepOutputs, type Project } from '$src/preset';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
const logger = new Logger("wiki/kittens/changesCopyIntoSync");
const { logInfo, logFatal } = logger;

/** 
 * Copies changes over from the processing step (if any).
 */
export async function changesCopyIntoSync() {
    logInfo("copying changes from processing step");

    const projects = wikiStepOutputs.map(e => e.project);
    for (const [projI, project] of projects.entries()) {
        const projectDiffAbsDirpath = path.join(projectDirpaths.diff, project);
        ensureDirectoryExistsAndEmpty(projectDiffAbsDirpath);

        logInfo(`[proj ${projI + 1} of ${projects.length}] project ${chalk.bold(project)}`);

        const projectOutputs = wikiStepOutputs.filter(e => e.project === project);
        for (const [outI, output] of projectOutputs.entries()) {
            logInfo(`\t[out ${outI + 1} of ${projectOutputs.length}] output ${chalk.italic(output.name)}`);

            const wikiAbsFilepath = path.join(projectStepDirpaths[project as Project].wiki_upload, output.relFilepath);
            if (!fs.existsSync(wikiAbsFilepath)) {
                logInfo(chalk.gray("❌ not found, at: " + wikiAbsFilepath));
                continue;
            }

            const diffDirAbsFilepath = path.join(projectDiffAbsDirpath, output.relFilepath);
            fs.ensureDirSync(path.parse(diffDirAbsFilepath).dir);
            fs.copyFileSync(wikiAbsFilepath, diffDirAbsFilepath);

            logInfo(`\t✅ copied! ${chalk.gray("to: " + diffDirAbsFilepath)}`);
        }
    }
}