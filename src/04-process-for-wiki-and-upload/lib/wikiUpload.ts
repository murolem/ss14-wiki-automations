import { editPage } from '$wiki/lib/ferrets/lib/editPage';
import type { Change, SimpleChangeType } from '$wiki/lib/kittens/steps/changesGet';
import type { Pr } from '$wiki/lib/prMake';
import { spinner } from '$wiki/lib/kittens/base';
import { Logger } from '$logger';
import { projectDirnames, projectDirpaths, wikiStepOutputs, type Project } from '$src/preset';
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

    // todo: account for changes filenames/paths/etc. these won't map to anything in the preset since if preset is changed then mapping will fail then a file will remain on the wiki.
    const mappedChanges = mapChangesToWikiUrls(changes);

    const pageEditSummary = `automated sync to upstream; sync PR: ${pr.data.html_url}`;

    for (const [i, change] of mappedChanges.entries()) {
        const logCounterPrefix = `[${i + 1} of ${mappedChanges.length}]`;
        const changeTypeLog = change.type === 'added' ? "creating" : "editing";

        switch (change.type) {
            case 'added':
            case 'modified':
                logInfo(`${logCounterPrefix} ${changeTypeLog} wikipage ${chalk.bold(change.wikiTitle)}, ${chalk.gray("file: " + change.diffAbsFilepath)}`);

                const contents = fs.readFileSync(change.diffAbsFilepath, 'utf-8');

                await editPage(change.wikiTitle, pageEditSummary, contents);

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
    outputName: string,
    diffAbsFilepath: string,
    wikiTitle: string,
}> {
    const res: ReturnType<typeof mapChangesToWikiUrls> = [];

    for (const change of changes) {
        const parts = change.path.split(path.sep);
        const project = parts[0];
        const projectFilepath = parts.slice(1).join(path.sep);

        const projectOutputs = wikiStepOutputs.filter(e => e.project === project);
        if (projectOutputs.length === 0) {
            logWarn(`project ${chalk.bold(project)} is not defined in project wiki outputs, skipping...`);
            continue;
        }

        for (const [i, output] of Object.entries(projectOutputs)) {
            if (path.relative(output.relFilepath, projectFilepath) === "") {
                // match!

                if (!output.wikipage)
                    continue;

                res.push({
                    type: change.type,
                    project: project as Project,
                    outputName: output.name,
                    diffAbsFilepath: path.resolve(path.join(projectDirpaths.diff, change.path)),
                    wikiTitle: output.wikipage
                });
            }
        }

        logWarn(`no matching output found for filepath ${chalk.bold(projectFilepath)} in project ${chalk.bold(project)}, skipping...`);
    }

    return res;
}