import { branchClone } from '$wiki/lib/kittens/steps/branchClone';
import { changesCommit } from '$wiki/lib/kittens/steps/changesCommit';
import { changesCopyIntoSync } from '$wiki/lib/kittens/steps/changesCopyIntoSync';
import { type Change, changesGet } from '$wiki/lib/kittens/steps/changesGet';
import { changesStage } from '$wiki/lib/kittens/steps/changesStage';
import { formatDateForCommit } from '$wiki/lib/kittens/utils/formatDate';
import { date } from '$wiki/lib/kittens/base';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
const logger = new Logger("wiki/diff");
const { logInfo, logWarn, logFatalAndThrow } = logger;
import { projectDirpaths, syncBranchPathBlacklist, wikiAutomationsRepo } from '$src/preset';
import chalk from 'chalk';
import { getFilesInDirectoryRecursively } from '$src/utils';
import fs from 'fs-extra';
import path from 'path';

/*
* This step creates a diff between "current state of the wiki" and the desired state considering any changes.
* 
* "current state of the wiki" is actually a separate branch of this repo (called the syncing branch), containing an ideal state
* of all relevant pages and files, NOT the whatever state the wiki is. The reasons for this are outlined at the end.
* 
* This step only does the local stuff. Actual PR is created in a separate step.
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

export default async function (): Promise<Change[] | null> {
    logInfo("emptying out sync dir")
    ensureDirectoryExistsAndEmpty(projectDirpaths.diff);

    await branchClone(wikiAutomationsRepo.syncBranchName);

    // remove every file and dir except .git
    // so that we can lay a clean output on top.
    for (const fileOrDir of fs.readdirSync(projectDirpaths.diff)) {
        if (fileOrDir === ".git" || syncBranchPathBlacklist.includes(fileOrDir)) {
            continue;
        }

        fs.rmSync(path.join(projectDirpaths.diff, fileOrDir), { recursive: true });
    }

    await changesCopyIntoSync();
    const [haveChanges, changes] = await changesGet();
    if (haveChanges) {
        const changesStr = chalk.bold(changes.length
            + " " + (changes.length === 1 ? "change" : "changes"));
        logInfo(`found ${changesStr} to upload:`);

        const changesAsStrs = changes.map(c => {
            switch (c.type) {
                case 'added': return chalk.bold(chalk.bgGreen('+') + '    added ') + c.path;
                case 'modified': return chalk.bold(chalk.bgBlue('±') + ' modified ') + c.path;
                case 'removed': return chalk.bold(chalk.bgRed('-') + '  removed ') + c.path;
                default:
                    logFatalAndThrow({ msg: `unknown change type '${c.type}'` });
                    throw ''//type guard
            }
        });

        logInfo(changesAsStrs.join("\n"));
    } else {
        logInfo("no changes to upload!");
        return null;
    }

    await changesStage(changes);
    await changesCommit("sync " + formatDateForCommit(date));

    return changes;
}