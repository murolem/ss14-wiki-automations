import { git, gitConfig as baseGitConfig } from '$git';
import type { octokit } from './base';
import { wikiAutomationsRepo, automationsGitAuthor, projectDirpaths, envVars } from '$src/preset';
import path from 'path';

export const gitConfig = {
    ...baseGitConfig,
    url: `https://github.com/${wikiAutomationsRepo.owner}/${wikiAutomationsRepo.repo}.git`,
    author: {
        name: automationsGitAuthor
    },
    dir: projectDirpaths.diff,
    gitdir: path.join(projectDirpaths.diff, ".git"),
    // // onAuth: spinner.info,
    // onAuthFailure: spinner.error,
    // // onAuthSuccess: spinner.info,
    // onMessage: spinner.info,
    // onPostCheckout: e => spinner.done(`${spinner.initialText} done!`),
    // onProgress: e => spinner.info(`${e.phase}: ${e.loaded}/${e.total}`),
    onAuth: () => ({ username: envVars.PR_MANAGE_GH_TOKEN })
} satisfies Partial<Parameters<typeof git.clone>[0] | Parameters<typeof git.commit>[0]>;

export const githubConfig = {
    owner: wikiAutomationsRepo.owner,
    repo: wikiAutomationsRepo.repo,
    base: wikiAutomationsRepo.syncBranchName,
} satisfies Partial<Parameters<typeof octokit.pulls.create>[0]>