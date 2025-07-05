import { wikiServer } from '$src/preset';

/**
 * Given a page title, construct a full wiki URL leading to that page.
 */
export function constructPageUrl(title: string): string {
    return encodeURI(`https://${wikiServer}/wiki/${title}`);
}