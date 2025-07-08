import { Logger } from '$logger';
import { DeferredPromise } from '$src/utils';
import { mwClient } from '$wiki/lib/ferrets/base';
import { constructPageUrl } from '$wiki/lib/ferrets/lib/constructPageUrl';
import chalk from 'chalk';
import type { PageEditedResult } from 'nodemw/lib/types';
const logger = new Logger("wiki/ferrets/lib/editPage");
const { logInfo } = logger;

/**
 * Edits a page on the wiki, replacing its content.
 */
export async function editPage(title: string, summary: string, content: string) {
    const onDone = new DeferredPromise<PageEditedResult | undefined>();

    logInfo(`running edit ot page: ${chalk.bold(constructPageUrl(title))}`);

    mwClient.edit(title, content, summary, (err, data) => {
        if (err) {
            onDone.reject(err);
        }

        onDone.resolve(data);
    });

    return await onDone;
}