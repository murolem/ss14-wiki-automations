import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Pushes changes to remote.
 */
export async function changesPush() {
    logInfo("pushing changes to remote");
    spinner.start("pushing changes");

    await git.push({
        ...gitConfig
    });
    spinner.done();
}