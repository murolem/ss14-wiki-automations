import { branchDelete } from '$wiki/lib/kittens/steps/branchDelete';
import { prMerge } from '$wiki/lib/kittens/steps/prMerge';
import type { Pr } from '$wiki/lib/prMake';

/*
* This step merges the PR into the remote syncing branch, concluding the upload process.
*/

export default async function (pr: Pr) {
    await prMerge(pr.data.number);
    await branchDelete(pr.data.head.ref);
}