import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/branchClone");
const { logInfo, logFatal } = logger;

/** 
 * Clones a wiki automations branch (without history).
 */
export async function branchClone(branch: string) {
    logInfo(`cloning '${branch}' branch`)
    spinner.start("cloning");

    await git.clone({
        ...gitConfig,
        singleBranch: true,
        depth: 1,
        ref: branch,
    });
    spinner.done();
}