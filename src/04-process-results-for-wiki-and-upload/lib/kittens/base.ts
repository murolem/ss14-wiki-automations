import { envVars } from '$src/preset';
import { Spinner } from '$utils/spinner';
import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
    auth: envVars.PR_MANAGE_GH_TOKEN
});

export const spinner = new Spinner();

export const date = new Date();