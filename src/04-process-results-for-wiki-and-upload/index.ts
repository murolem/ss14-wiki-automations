import preprocess from './lib/preprocess';
import diff from './lib/diff';
import prMake from './lib/prMake';
import prMergeWithCleanup from './lib/prMergeWithCleanup';
import wikiUpload from './lib/wikiUpload';
import { Logger } from '$logger';
const logger = new Logger("wiki");
const { logInfo, logWarn, logFatal } = logger;

async function main() {
    await preprocess();

    const changes = await diff();
    if (!changes) {
        logInfo("✅ no changes to upload");
        return;
    }

    const pr = await prMake();
    await wikiUpload(changes, pr);
    await prMergeWithCleanup(pr);

    logInfo("✅ all done");
}

await main();