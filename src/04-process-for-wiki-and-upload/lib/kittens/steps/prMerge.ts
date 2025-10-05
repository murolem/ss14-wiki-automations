import { octokit, spinner } from '../base';
import { Logger } from '$logger';
import { githubConfig } from '$wiki/lib/kittens/config';
import { assertOkStatusCode } from '$wiki/lib/kittens/utils/assert';
import chalk from 'chalk';
const logger = new Logger("wiki/kittens/prMerge");
const { logInfo, logFatalAndThrow } = logger;

/** 
 * Merges a PR.
 */
export async function prMerge(prNumber: number) {
    logInfo(`merging PR #${chalk.bold(prNumber)}`);
    spinner.start("merging PR");

    const prMergeRes = await octokit.pulls.merge({
        ...githubConfig,
        pull_number: prNumber,
    });
    spinner.done();
    assertOkStatusCode(prMergeRes.status, prMergeRes);
    if (!prMergeRes.data.merged) {
        logFatalAndThrow({
            msg: "PR wasn't merged: " + prMergeRes.data.message,
            data: prMergeRes,
            stringifyData: true
        });
    }
}