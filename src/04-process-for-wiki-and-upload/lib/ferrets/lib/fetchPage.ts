import { DeferredPromise } from '$src/utils';
import { mwClient } from '$wiki/lib/ferrets/base';

/**
 * Retrieves a page from the wiki.
 */
export async function fetchPage(title: string) {
    const onDone = new DeferredPromise<string | undefined>();

    mwClient.getArticle(title, (err, data) => {
        if (err) {
            onDone.reject(err);
        }

        onDone.resolve(data);
    });

    return await onDone;
}