import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Checkouts a branch.
 */
export async function branchCheckout() {
    // impl
}