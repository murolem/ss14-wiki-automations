import { Logger } from '$logger';
import { projectDirpaths, projectStepDirpaths, projectWikiOutputs, type Project } from '$src/preset';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import fs from 'fs-extra';
const logger = new Logger("wiki/diff");
const { logInfo, logWarn, logFatal } = logger;
import { git, gitConfig as baseGitConfig } from '$git';
import { Spinner } from '$utils/spinner';
import path from 'path';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync } from '$utils/writeJson';


/*
* 
* This step creates a diff between "current state of the wiki" and the desired state considering any changes.
* 
* "current state of the wiki" is actually a separate branch of this repo (called the syncing branch), containing an ideal state
* of all relevant pages and files, NOT the whatever state the wiki is. The reasons for this are outlined at the end.
* 
* All new changes (if any), are PRed and automatically merged with the syncing branch. 
* Then the new changes are propagated to the wiki with a link to the PR.
* 
* Reasons why not just check the wiki for any changes directly instead of having a syncing branch:
* - It's kind of cool to have the ideal state and diffs and all that reflected on github.
* - It gives an overview of what is being automated.
* - It allows to propagate the state on program crashes (granted there's a recovery process for this).
* - It doesn't span the wiki with requests. Which would get rate limited quickly, even for bots. 
* This would be (or already is?) really important once assets start to get uploaded (think thousands of item images - although that would probably be a one time activity).
* 
* One of the cons though is if someone changes a file that suppose to be automated,
* the change will remain so until an automatic change comes. Which could be a while for more granular
* files (such as A-Z item pages; although they are updated frequently). 
*/

export default async function () {
    // should be already made and ready atp by the sync clone command
    const diffDirpath = projectDirpaths.diff;
    ensureDirectoryExistsAndEmpty(diffDirpath);
    // if (fs.existsSync(diffDirpath)) {
    //     logFatal({
    //         msg: "failed to diff: diff dir is expected to exists atp",
    //         throw: true,
    //         data: {
    //             diffDirpath
    //         }
    //     });
    // }

    const spinner = new Spinner();

    const gitConfig = {
        ...baseGitConfig,
        dir: diffDirpath,
        gitdir: path.join(diffDirpath, ".git"),
        onAuth: spinner.info,
        onAuthFailure: spinner.error,
        onAuthSuccess: spinner.info,
        onMessage: spinner.info,
        onPostCheckout: e => spinner.done(`${spinner.initialText} done!`),
        onProgress: e => spinner.info(`${e.phase}: ${e.loaded}/${e.total}`),
    } satisfies Partial<Parameters<typeof git.clone>[0]>;

    // =============

    // const repo = git(diffDirpath);
    logInfo("cloning origin sync branch")

    spinner.start("cloning")

    await git.clone({
        ...gitConfig,
        url: "https://github.com/murolem/ss14-wiki-automations.git",
        singleBranch: true,
        depth: 1,
        ref: "sync",
    });

    logInfo("copying output into sync dir");

    // spinner.start("copying")

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

    const status = await git.statusMatrix({
        ...gitConfig
    });

    console.log(status);






    // await repo.clone("https://github.com/murolem/ss14-wiki-automations.git", ".", [
    //     "-b 'sync'",
    //     "--depth 1",
    //     "--single-branch"
    // ]);
}