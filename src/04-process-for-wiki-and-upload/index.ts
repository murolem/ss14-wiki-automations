import preprocess from './lib/preprocess';
import diff from './lib/diff';
import prMake from './lib/prMake';
import prMergeWithBranchDelete from './lib/prMergeWithBranchDelete';
import wikiUpload from './lib/wikiUpload';
import { Logger } from '$logger';
const logger = new Logger("wiki");
const { logInfo, logWarn, logFatalAndThrow } = logger;
// @ts-ignore it has the import
import chalk from 'chalk';

export default async function (opts: Partial<{
    /**
     * Whether to create and push PR in the sync branch.
     * @default true
     */
    createPr: boolean,

    /**
     * Whether to upload changes to the wiki.
     * @default true
     */
    uploadToWiki: boolean
}> = {}) {
    opts.createPr ??= true;
    opts.uploadToWiki ??= true;

    if (!opts.createPr)
        logInfo(chalk.green("[NO PR MODE]"));
    if (!opts.uploadToWiki)
        logInfo(chalk.green("[NO UPLOAD MODE]"));

    await preprocess();

    const changes = await diff();
    if (!changes) {
        logInfo("✅ no changes to upload");
        return;
    }

    if (!opts.createPr) {
        logInfo("✅ no PR mode enabled, exiting");
        return;
    }
    const pr = await prMake();

    if (!opts.uploadToWiki) {
        logInfo("✅ no upload mode enabled, exiting");
        return;
    }
    await wikiUpload(changes, pr);
    await prMergeWithBranchDelete(pr);

    logInfo("✅ all done");
}