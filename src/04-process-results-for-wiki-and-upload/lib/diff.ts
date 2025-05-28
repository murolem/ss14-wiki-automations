import { Logger } from '$logger';
import { automationsGitAuthor, projectDirpaths, projectStepDirpaths, projectWikiOutputs, syncBranchPathBlacklist, wikiAutomationsRepo, type Project } from '$src/preset';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import fs from 'fs-extra';
const logger = new Logger("wiki/diff");
const { logInfo, logWarn, logFatal } = logger;
import { Spinner } from '$utils/spinner';
import path from 'path';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync } from '$utils/writeJson';
import { toOsPath } from '$utils/toOsPath';
import { git } from '$git';
import { changesCopyIntoSync } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/changesCopyIntoSync';
import { changesGet } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/changesGet';
import { changesStage } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/changesStage';
import { changesCommit } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/changesCommit';
import { formatDateForBranchName, formatDateForCommit, formatDateForPrTitle } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/utils/formatDate';
import { branchClone } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/branchClone';
import { branchCreate, branchCreateWithCheckout } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/branchCreate';
import { changesPush } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/changesPush';
import { prCreate } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/steps/prCreate';
import { date, spinner } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/base';

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

export default async function () {
    logInfo("emptying out sync dir")
    ensureDirectoryExistsAndEmpty(projectDirpaths.diff);

    await branchClone(wikiAutomationsRepo.syncBranchName);
    await changesCopyIntoSync();
    const [haveChanges, changes] = await changesGet();
    if (!haveChanges) {
        logInfo("✅ exiting");
        return;
    }

    await changesStage(changes);
    await changesCommit("sync " + formatDateForCommit(date));
}