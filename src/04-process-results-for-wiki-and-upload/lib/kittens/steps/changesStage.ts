import { git } from '$git';
import { gitConfig } from '../config';
import { spinner } from '../base';
import { wikiAutomationsRepo } from '$src/preset';
import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/cloneBranch");
const { logInfo, logFatal } = logger;

/** 
 * Stages given changes.
 */
export async function changesStage(changedPaths: string[]) {
    logInfo("staging changes");
    spinner.start("staging");

    for (const filepath of changedPaths) {
        await git.add({
            ...gitConfig,
            filepath
        })
    }
    spinner.done();
}