import { git } from '$git';
import { gitConfig, githubConfig } from '../config';
import { octokit, spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
import { formatDateForPrTitle } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/utils/formatDate';
import { assertOkStatusCode } from '$src/04-process-results-for-wiki-and-upload/lib/kittens/utils/assert';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

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