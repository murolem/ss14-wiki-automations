/*
* This steps creates a new branch out of the changes from the local syncing branch,
* to be merged into the syncing branch with a PR.
* 
* No further actions past the creation of a PR are done in this step.
*/

export default async function name() {
    const headBranchName = "sync-head-" + formatDateForBranchName(date);
    await branchCreateWithCheckout(headBranchName);
    await changesPush();

    const pr = await prCreate(
        headBranchName,
        "New changes OwO ! " + formatDateForPrTitle(date),
        `\
### [AUTOMATED] ###
Contains changes for the syncing branch up to upstream commit {todo specify upstream commit}.

This PR will be merged **automatically** by the **/main**'s branch default action into the **/${wikiAutomationsRepo.syncBranchName}** branch after all the changes have been reflected to the wiki. Meow :3`
    );
}