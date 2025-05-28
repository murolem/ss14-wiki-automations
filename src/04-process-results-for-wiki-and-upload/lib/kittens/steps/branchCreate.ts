import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Creates a new local branch.
 */
export async function branchCreate(name: string, checkout: boolean = false) {
    logInfo("creating a local branch");
    spinner.start("creating branch");

    await git.branch({
        ...gitConfig,
        ref: name,
        checkout
    });
    spinner.done();
}

/** 
 * Creates a new local branch with checkout enabled.
 */
export async function branchCreateWithCheckout(name: string) {
    await branchCreate(name, true);
}