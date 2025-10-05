import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { Logger } from '$logger';
import chalk from 'chalk';
const logger = new Logger("wiki/kittens/branchCreate");
const { logInfo, logFatalAndThrow } = logger;

/** 
 * Creates a new local branch.
 */
export async function branchCreate(name: string, checkout: boolean = false) {
    logInfo(`creating a local branch ${chalk.bold(name)}`);
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