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
        switch (change.type) {
            case 'added':
            case 'modified':
                await git.add({
                    ...gitConfig,
                    filepath: change.path
                });
                break;
            case 'removed':
                await git.remove({
                    ...gitConfig,
                    filepath: change.path
                });
                break;
            default: {
                logFatal({ msg: `change type ${change.type} is unsupported`, throw: true });
                throw ''// type guard
            }
        }
    }
    spinner.done();
}