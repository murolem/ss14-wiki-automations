import { wikiAutomationsRepo } from '$src/preset';
import { date } from '$wiki/lib/kittens/base';
import { branchCreateWithCheckout } from '$wiki/lib/kittens/steps/branchCreate';
import { changesPush } from '$wiki/lib/kittens/steps/changesPush';
import { prCreate } from '$wiki/lib/kittens/steps/prCreate';
import { formatDateForBranchName, formatDateForPrTitle } from '$wiki/lib/kittens/utils/formatDate';

/*
* This steps creates a new branch out of the changes from the local syncing branch,
* to be merged into the syncing branch with a PR.
* 
* No further actions past the creation of a PR are done in this step.
*/

export type Pr = Awaited<ReturnType<typeof prCreate>>;

export default async function name(): Promise<Pr> {
    const headBranchName = "sync-head-" + formatDateForBranchName(date);
    await branchCreateWithCheckout(headBranchName);
    await changesPush();

    return await prCreate(
        headBranchName,
        "New changes OwO ! " + formatDateForPrTitle(date),
        `\
### [AUTOMATED] ###
Contains changes for the syncing branch up to upstream commit {todo specify upstream commit}

This PR will be merged **automatically** by the **/main**'s branch default action into the **/${wikiAutomationsRepo.syncBranchName}** branch after all the changes have been reflected to the wiki. Meow :3

**Action running this PR:** {todo specify action}`
    );
}