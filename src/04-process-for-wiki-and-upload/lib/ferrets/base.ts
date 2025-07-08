import { envVars, wikiApiPath, wikiServer } from '$src/preset';
import { DeferredPromise } from '$src/utils';
import MwBot from "nodemw";

export const mwClient = new MwBot({
    protocol: "https", // Wikipedia now enforces HTTPS
    server: wikiServer, // host name of MediaWiki-powered site
    path: wikiApiPath, // path to api.php script
    debug: false, // is more verbose when set to true
});

export const mwClientLogin = async () => {
    const onLogin = new DeferredPromise();
    mwClient.logIn(envVars.WIKI_LOGIN, envVars.WIKI_PASSWORD, err => {
        if (err) {
            throw err;
        }

        onLogin.resolve(true);
    });
    await onLogin;
}