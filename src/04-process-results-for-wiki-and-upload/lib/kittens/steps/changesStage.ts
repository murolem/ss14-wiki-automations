import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { Logger } from '$logger';
import type { Change } from '$wiki/lib/kittens/steps/changesGet';
const logger = new Logger("wiki/kittens/changesStage");
const { logInfo, logFatal } = logger;

/** 
 * Stages given changes.
 */
export async function changesStage(changes: Change[]) {
    logInfo("staging changes");
    spinner.start("staging");

    for (const change of changes) {
        // skip removals since we do not need to stage them (nor can we)
        if (change.type === 'removed') {
            continue;
        }

        await git.add({
            ...gitConfig,
            filepath: change.path
        })
    }
    spinner.done();
}