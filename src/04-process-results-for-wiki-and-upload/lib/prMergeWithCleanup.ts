/*
* This step merges the PR into the remote syncing branch, concluding the upload process.
*/

export default async function () {
    logInfo("merging PR");
    spinner.start("merging PR");

    const prMergeRes = await octokit.pulls.merge({
        ...githubConfig,
        pull_number: pr.data.number,
    });
    spinner.done();
    assertOkStatusCode(prMergeRes.status, prMergeRes);

    if (!prMergeRes.data.merged) {
        logFatal({
            msg: "PR wasn't merged: " + prMergeRes.data.message,
            throw: true,
            data: prMergeRes,
            stringifyData: true
        });
    }



    logInfo("deleting head branch");
    spinner.start("deleting branch");

    await git.push({
        ...gitConfig,
        ref: headBranchName,
        delete: true,
    });
    spinner.done();
}