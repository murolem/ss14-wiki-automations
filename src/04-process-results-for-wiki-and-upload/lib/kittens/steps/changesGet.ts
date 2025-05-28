import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { syncBranchPathBlacklist, wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Checks whether there are any changes in the sync working dir.
 * 
 * Returns a tuple:
 * - boolean indicating changes
 * - array? of changed paths
 */
export async function changesGet(): Promise<[false] | [true, string[]]> {
    // array of changed paths
    const statusArr = await git.statusMatrix({
        ...gitConfig
    });

    const validChangedPaths = statusArr
        .filter(row => !syncBranchPathBlacklist.includes(toOsPath(row[0] /* filepath */))) // todo check if source paths are comparable to blacklisted paths
        .map(row => row[0]);

    if (validChangedPaths.length === 0) {
        logInfo("no changes to upload!");
        return [false];
    }

    const changesStr = chalk.bold(validChangedPaths.length
        + " " + (validChangedPaths.length === 1 ? "change" : "changes"));
    logInfo(`found ${changesStr} to upload`);

    return [true, validChangedPaths];
}