import { git } from '$git';
import { gitConfig } from '../config';
import { syncBranchPathBlacklist } from '$src/preset';
import { Logger } from '$logger';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import type { StatusRow } from 'isomorphic-git';
const logger = new Logger("wiki/kittens/changesGet");
const { logInfo, logFatal } = logger;

/** Simplified change type. */
export type SimpleChangeType =
    "added"
    | "modified"
    | "removed";

export type Change = {
    path: string,
    type: SimpleChangeType
}

/** 
 * Checks whether there are any changes in the sync working dir.
 * 
 * Returns a tuple:
 * - boolean indicating changes
 * - array? of changed paths
 */
export async function changesGet(): Promise<[false] | [true, Array<Change>]> {
    // array of changed paths
    const statusArr = await git.statusMatrix({
        ...gitConfig
    });

    const validChangedPaths = statusArr
        .filter(status => !syncBranchPathBlacklist.includes(toOsPath(status[0] /* filepath */))) // todo check if source paths are comparable to blacklisted paths
        .map(status => ({
            path: toOsPath(status[0]),
            type: statusToSimpleChangeType(status)
        }));

    if (validChangedPaths.length === 0) {
        logInfo("no changes to upload!");
        return [false];
    }

    return [true, validChangedPaths];
}

function statusToSimpleChangeType(status: StatusRow): SimpleChangeType {
    const head = status[1];
    const workdir = status[2];
    const stage = status[3];

    if (head === 0 /* absent */) {
        return 'added';
    } else if (head === 1 /* present */ && workdir === 2 /* different from HEAD */) {
        return 'modified'
    } else if (head === 1 /* present */ && workdir === 0 /* absent */) {
        return 'removed';
    } else {
        logFatal({
            msg: `failed to get a simple change type: unknown status combo: ${chalk.bold(`${head}/${workdir}/${stage}`)}`,
            throw: true
        });
        throw ''//guard
    }
}