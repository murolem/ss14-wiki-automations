import preprocess from './lib/preprocess';
import diff from './lib/diff';
import prMake from './lib/prMake';
import prMergeWithBranchDelete from './lib/prMergeWithBranchDelete';
import wikiUpload from './lib/wikiUpload';
import { Logger } from '$logger';
const logger = new Logger("wiki");
const { logInfo, logWarn, logFatal } = logger;
// @ts-ignore it has the import
import minimist from 'minimist';
import chalk from 'chalk';

const args = minimist(process.argv.slice(2));
const noPrMode = !!args.nopr;
const noUploadMode = !!args.noupload;

async function main() {
    if (noPrMode)
        logInfo(chalk.green("[NO PR MODE]"));
    if (noUploadMode)
        logInfo(chalk.green("[NO UPLOAD MODE]"));

    await preprocess();

    const changes = await diff();
    if (!changes) {
        logInfo("✅ no changes to upload");
        return;
    }

    if (noPrMode) {
        logInfo("✅ no PR mode enabled, exiting");
        return;
    }
    const pr = await prMake();

    if (noUploadMode) {
        logInfo("✅ no upload mode enabled, exiting");
        return;
    }
    await wikiUpload(changes, pr);
    await prMergeWithBranchDelete(pr);

    logInfo("✅ all done");
}

await main();