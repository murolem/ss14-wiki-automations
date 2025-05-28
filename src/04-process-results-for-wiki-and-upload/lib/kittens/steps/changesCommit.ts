import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
import { formatDateForCommit } from '../utils/formatDate';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Commits stages changes in the sync dir.
 */
export async function changesCommit(message: string) {
    logInfo("committing changes");
    spinner.start("committing");

    await git.commit({
        ...gitConfig,
        message,
    });
    spinner.done();
}