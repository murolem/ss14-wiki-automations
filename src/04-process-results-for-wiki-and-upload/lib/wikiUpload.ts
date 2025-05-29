import { editPage } from '$wiki/lib/ferrets/lib/editPage';
import type { Change, SimpleChangeType } from '$wiki/lib/kittens/steps/changesGet';
import type { Pr } from '$wiki/lib/prMake';
import { spinner } from '$wiki/lib/kittens/base';
import { Logger } from '$logger';
import { projectDirnames, projectDirpaths, projectWikiOutputs, type Project } from '$src/preset';
import chalk from 'chalk';
import path from 'path';
const logger = new Logger("wiki/wikiUpload")
const { logInfo, logWarn, logFatal } = logger;
import fs from 'fs';
import { mwClientLogin } from '$wiki/lib/ferrets/base';

/*
* In this step, local changes from the syncing branch are uploaded to the wiki.
*/

/**
 * 
 * @param changes A list of filepaths relative to the sync that have changes 
 * @param pr PR that was created for the changes.
 */
export default async function (changes: Change[], pr: Pr) {
    logInfo("uploading changes to the wiki");

    await mwClientLogin();

    const mappedChanges = mapChangesToWikiUrls(changes);

    const pageEditSummary = `automated sync to upstream; sync PR: ${pr.data.html_url}`;

    for (const [i, change] of mappedChanges.entries()) {
        const logCounterPrefix = `[${i + 1} of ${mappedChanges.length}]`;
        const changeTypeLog = change.type === 'added' ? "creating" : "editing";

        switch (change.type) {
            case 'added':
            case 'modified':
                logInfo(`${logCounterPrefix} ${changeTypeLog} wikipage ${chalk.bold(change.wikiTitle)}, ${chalk.gray("file: " + change.absFilepath)}`);
                spinner.start(changeTypeLog);

                const contents = fs.readFileSync(change.absFilepath, 'utf-8');

                await editPage(change.wikiTitle, pageEditSummary, contents);
                spinner.done();

                break;
            case 'removed':
                logWarn("page removal not implemented, skipping...");
                continue;
            default:
                logFatal({ throw: true, msg: "unknown change type: " + change.type });
                throw ''//guard
        }
    }

    logInfo("✅ uploading complete!");
}

/** Maps each change to a wiki page URL. */
function mapChangesToWikiUrls(changes: Change[]): Array<{
    type: SimpleChangeType,
    project: Project,
    outputKey: string,
    absFilepath: string,
    wikiTitle: string,
}> {
    const res: ReturnType<typeof mapChangesToWikiUrls> = [];

    for (const change of changes) {
        const parts = change.path.split(path.sep);
        const project = parts[0];
        const projectFilepath = parts.slice(1).join(path.sep);

        if (!Object.keys(projectWikiOutputs).includes(project)) {
            logWarn(`project ${chalk.bold(project)} is not defined in project wiki outputs, skipping...`);
            continue;
        }

        const outputRecords = projectWikiOutputs[project as keyof typeof projectWikiOutputs];
        for (const [outputKey, outputRecord] of Object.entries(outputRecords)) {
            if (outputRecord.filepath === projectFilepath) {
                // match!

                res.push({
                    type: change.type,
                    project: project as Project,
                    outputKey,
                    absFilepath: path.resolve(path.join(projectDirpaths.diff, change.path)),
                    wikiTitle: outputRecord.wikipage
                });
            }
        }

        logWarn(`no matching output found for filepath ${chalk.bold(projectFilepath)} in project ${chalk.bold(project)}, skipping...`);
    }

    return res;
}