import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/changesCommit");
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