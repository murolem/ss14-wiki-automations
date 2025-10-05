import { octokit, spinner } from '../base';
import { Logger } from '$logger';
import { githubConfig } from '$wiki/lib/kittens/config';
import { assertOkStatusCode } from '$wiki/lib/kittens/utils/assert';
const logger = new Logger("wiki/kittens/prCreate");
const { logInfo, logFatalAndThrow } = logger;

/** 
 * Creates a new PR into the syncing branch.
 */
export async function prCreate(fromBranch: string, title: string, body: string): ReturnType<typeof octokit.pulls.create> {
    logInfo("creating PR");
    spinner.start("creating PR");

    const pr = await octokit.pulls.create({
        ...githubConfig,
        head: fromBranch,
        title,
        body
    });
    spinner.done();
    assertOkStatusCode(pr.status, pr);

    return pr;
}