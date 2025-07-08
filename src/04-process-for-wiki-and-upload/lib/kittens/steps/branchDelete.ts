import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { Logger } from '$logger';
import chalk from 'chalk';
const logger = new Logger("wiki/kittens/branchDelete");
const { logInfo, logFatal } = logger;

/** 
 * Deletes a branch.
 */
export async function branchDelete(branch: string) {
    logInfo(`deleting branch ${chalk.bold(branch)}`);
    spinner.start("deleting branch");

    await git.push({
        ...gitConfig,
        ref: branch,
        delete: true,
    });
    spinner.done();
}