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
            type: statusToSimpleChangeType(status)! // !explicit assertion cuz TS can't narrow its buns to recognize this, unfortunately; also checked below
        }))
        .filter(e => e.type);

    if (validChangedPaths.some(e => !e.type)) {
        logFatal({ msg: "encountered a falsy value for a change", throw: true, data: { culpritChanges: validChangedPaths.filter(e => !e.type) } });
        throw ''//type guard
    }

    if (validChangedPaths.length === 0) {
        logInfo("no changes to upload!");
        return [false];
    }

    return [true, validChangedPaths];
}

/**
 * Maps git change status matrix entry to a simple status literal.
 * 
 * Returns `null` for any change that did not do any modifications.
 * @param status 
 * @returns 
 */
function statusToSimpleChangeType(status: StatusRow): SimpleChangeType | null {
    const head = status[1];
    const workdir = status[2];
    const stage = status[3];

    if (head === 0 /* absent */) {
        return 'added';
    } else if (head === 1 /* present */ && workdir === 2 /* different from HEAD */) {
        return 'modified'
    } else if (head === 1 /* present */ && workdir === 0 /* absent */) {
        return 'removed';
    } else if (head === 1 && workdir === 1 && stage === 1) { /* unmodified - why is this even a thing? */
        return null;
    } else {
        logFatal({
            msg: `failed to get a simple change type: unknown status combo: ${chalk.bold(`${head}/${workdir}/${stage}`)}`,
            throw: true
        });
        throw ''//guard
    }
}