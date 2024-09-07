import Logger from '@aliser/logger';
const logger = new Logger("04-upload-results-to-wiki");
const { logInfo, logError, logWarn } = logger;
import chalk from 'chalk';
import MwBot from "nodemw";
import dotenv from 'dotenv';
import { PageEditedResult } from 'nodemw/lib/types';
import { DeferredPromise, getLocalGitRepoHeadShortCommitHash } from '$src/utils';
import { dataPaths, projectRelPaths } from '$src/preset';
import path from 'path';
import fs from 'fs-extra';
dotenv.config();

logInfo(chalk.bold("final data processing step with wiki uploads"));

logInfo("setting up wiki stuff")

const wikiLogin = process.env.WIKI_LOGIN;
if (!wikiLogin) { logError("no wiki login defined. define 'WIKI_LOGIN' in .env file", { throwErr: true }); throw '' /* type guard */ }

const wikiPassword = process.env.WIKI_PASSWORD;
if (!wikiPassword) { logError("no wiki login defined. define 'WIKI_PASSWORD' in .env file", { throwErr: true }); throw '' /* type guard */ }

const runUrl = process.env.GH_RUN_URL;

const wikiServer = 'wiki.spacestation14.com';

let ss14RepoCurrentCommitShortHash: string;

const mwClient = new MwBot({
    protocol: "https", // Wikipedia now enforces HTTPS
    server: "wiki.spacestation14.com", // host name of MediaWiki-powered site
    path: "/w", // path to api.php script
    debug: false, // is more verbose when set to true
});

mwClient.logIn(wikiLogin, wikiPassword, err => {
    if (err) {
        throw err
    }

    main();
});

// ===============

function constructWikiPageUrl(page: string): string {
    return `https://${wikiServer}/wiki/${page}`;
}

async function getArticle(title: string) {
    const promise = new DeferredPromise<string | undefined>();

    mwClient.getArticle(title, (err, data) => {
        if (err) {
            promise.reject(err);
        }

        promise.resolve(data);
    });

    return promise;
}

async function editPage(title: string, summary: string, content: string) {
    const promise = new DeferredPromise<PageEditedResult | undefined>();

    logInfo(`running edit ot page: ${chalk.bold(encodeURI(constructWikiPageUrl(title)))}`);

    mwClient.edit(title, content, summary, (err, data) => {
        if (err) {
            promise.reject(err);
        }

        promise.resolve(data);
    });

    // promise.resolve();

    return promise;
}

async function main() {
    ss14RepoCurrentCommitShortHash = getLocalGitRepoHeadShortCommitHash(projectRelPaths.ss14Repo);

    logInfo(chalk.bold(`SS14 HEAD at ${chalk.green("#" + ss14RepoCurrentCommitShortHash)}`));

    // =================

    await processPage({
        projectOutputDataPathAlias: 'recipes.lathes',
        wikiDataPathAlias: 'recipes.lathes',
    });

    await processPage({
        projectOutputDataPathAlias: 'entities.processed.entity-names-by-entity-ids',
        wikiDataPathAlias: 'entities.wiki.entity-names-by-entity-ids'
    });

    await processPage({
        projectOutputDataPathAlias: 'entities.processed.entity-ids-by-lowercase-entity-names',
        wikiDataPathAlias: 'entities.wiki.entity-ids-by-lowercase-entity-names'
    });


    // =================

    // const newItemNamesByItemIds = enititesList
    //     .reduce((accum, entry) => {
    //         if (entry.name) {
    //             accum[entry.id] = entry.name;
    //         }

    //         return accum;
    //     }, {} as Record<string, string>);

    // const newItemIds = Object.keys(newItemNamesByItemIds);

    // // fake processing function so we can write our data without manually doing filesystem stuff
    // processAndSaveConvertedData({
    //     convertedDataPathAlias: 'noop',
    //     outputDataPathAlias: 'entities.dump.parsed.names-record',
    //     processor({ files, parseFiles, writeToOutput }) {
    //         writeToOutput(newItemNamesByItemIds);
    //     }
    // });


    // logInfo(`fetching ${chalk.bold('item names by item ids')}`)
    // const currentItemNamesByItemIds = await fetch('https://wiki.spacestation14.com/wiki/Module:Item/item names by item ids.json?action=raw')
    //     .then(res => res.json())
    //     .then(resJson => z.record(z.string(), z.string()).parse(resJson));
    // // const currentItemNamesByItemIds: Record<string, string> = {}

    // const currentItemIds = Object.keys(currentItemNamesByItemIds);

    // // fake processing function so we can write our data without manually doing filesystem stuff
    // processAndSaveConvertedData({
    //     convertedDataPathAlias: 'noop',
    //     outputDataPathAlias: 'entities.dump.wiki.current.item-names-by-item-ids',
    //     processor({ files, parseFiles, writeToOutput }) {
    //         writeToOutput(currentItemNamesByItemIds);
    //     }
    // });


    // const itemsIdsToAddToCurrent = newItemIds
    //     .filter(itemId => !currentItemIds.includes(itemId));

    // if (itemsIdsToAddToCurrent.length === 0) {
    //     logInfo("no new items to add");
    // } else {
    //     logInfo(`adding new items (${itemsIdsToAddToCurrent.length})...`);

    //     for (const itemId of itemsIdsToAddToCurrent) {
    //         currentItemNamesByItemIds[itemId] = newItemNamesByItemIds[itemId]
    //     }
    // }


    // const unknownItemIdsInCurrent = currentItemIds
    //     .filter(itemId => !newItemIds.includes(itemId));

    // if (unknownItemIdsInCurrent.length === 0) {
    //     logInfo("no unknown item ids in the current wiki version")
    // } else {
    //     logInfo("custom or removed items present in the current wiki version: " + unknownItemIdsInCurrent.length);
    //     logInfo('list', unknownItemIdsInCurrent, { stringifyAdditional: true })
    // }












    // // const itemIdsOfItemsWithDifferentMainNames = currentItemIds
    // //     .filter(itemId => {
    // //         const currentItemMainName = currentItemNamesByItemIds[itemId][0];
    // //         const itemMainNameFromParsed = newItemNamesByItemIds[itemId]?.[0];

    // //         // if item doesn't exist/custom, do not consider it to have a different name
    // //         // since we can't compare them.
    // //         // such items are processed in different way in another place.
    // //         if (!itemMainNameFromParsed) {
    // //             return false;
    // //         } else if (currentItemMainName !== itemMainNameFromParsed) {
    // //             return true
    // //         }
    // //     });

    // // if (itemIdsOfItemsWithDifferentMainNames.length === 0) {
    // //     logInfo("no items with different main names")
    // // } else {
    // //     logInfo(`updating main names of some of the existing items (${itemIdsOfItemsWithDifferentMainNames.length})`);

    // //     for (const [i, itemId] of itemIdsOfItemsWithDifferentMainNames.entries()) {
    // //         const oldName = currentItemNamesByItemIds[itemId][0];
    // //         const newName = newItemNamesByItemIds[itemId][0];

    // //         currentItemNamesByItemIds[itemId][0] = newName;

    // //         logInfo(`${i + 1}. ${chalk.bold(itemId)}:`)
    // //         logInfo(`${chalk.italic("old:")} ${oldName}`)
    // //         logInfo(`${chalk.italic("new:")} ${newName}`)
    // //     }
    // // }

    // // logInfo("sorting...")

    // // const itemNamesRecordCurrentSortedMap = new Map();
    // // const itemIdsRecordCurrentSorted = Object.keys(itemNamesRecordCurrent)
    // //     .sort((a, b) => a.localeCompare(b));

    // // for (const key of itemIdsRecordCurrentSorted) {
    // //     itemNamesRecordCurrentSortedMap.set(key, itemNamesRecordCurrent[key]);
    // // }

    // // fake processing function so we can write our data without manually doing filesystem stuff
    // processAndSaveConvertedData({
    //     convertedDataPathAlias: 'noop',
    //     outputDataPathAlias: 'entities.dump.wiki.new.item-names-by-item-ids',
    //     processor({ files, parseFiles, writeToOutput }) {
    //         writeToOutput(currentItemNamesByItemIds);
    //     }
    // });


    // logInfo(`fetching ${chalk.bold('item item ids by item names')}`)
    // const currentItemIdsByItemNames = await fetch('https://wiki.spacestation14.com/wiki/Module:Item/item ids by item names.json?action=raw')
    //     .then(res => res.json())
    //     .then(resJson => z.record(z.string(), z.string()).parse(resJson));

    // // fake processing function so we can write our data without manually doing filesystem stuff
    // processAndSaveConvertedData({
    //     convertedDataPathAlias: 'noop',
    //     outputDataPathAlias: 'entities.dump.wiki.current.item-ids-by-item-names',
    //     processor({ files, parseFiles, writeToOutput }) {
    //         writeToOutput(currentItemIdsByItemNames);
    //     }
    // });

    // logInfo(`fetching old ${chalk.bold('item item names by item ids')}`)
    // const oldCurrentItemNamesByItemIds = await fetch('https://wiki.spacestation14.com/wiki/Module:Item/item names by item id.json?action=raw')
    //     .then(res => res.json())
    //     .then(resJson => z.record(z.string(), z.string().array()).parse(resJson));

    // const extraItemIdsByItemNames = Object.entries(oldCurrentItemNamesByItemIds)
    //     .reduce((accum, [itemId, names]) => {
    //         if (names.length > 1) {
    //             for (const name of names.slice(1)) {
    //                 accum[name.toLocaleLowerCase()] = itemId
    //             }
    //         }

    //         return accum;
    //     }, {} as Record<string, string>);

    // logInfo('extra item ids by item names', extraItemIdsByItemNames, {
    //     stringifyAdditional: true
    // })

    // // todo check for duplicate names
    // const newItemIdsByItemNames = Object.entries(currentItemNamesByItemIds)
    //     .reduce((accum, [itemId, itemName]) => {
    //         const itemNameLowercase = itemName.toLocaleLowerCase();
    //         if (!accum[itemNameLowercase]) {
    //             accum[itemNameLowercase] = itemId;
    //         }

    //         return accum;
    //     }, {} as Record<string, string>);

    // for (const [itemName, itemId] of Object.entries(extraItemIdsByItemNames)) {
    //     newItemIdsByItemNames[itemName] = itemId;
    // }

    // // fake processing function so we can write our data without manually doing filesystem stuff
    // processAndSaveConvertedData({
    //     convertedDataPathAlias: 'noop',
    //     outputDataPathAlias: 'entities.dump.wiki.new.item-ids-by-item-names',
    //     processor({ files, parseFiles, writeToOutput }) {
    //         writeToOutput(newItemIdsByItemNames);
    //     }
    // });
}







// ============

type UploadPageProcessor = (
    args: {
        currentContent: unknown,
        newContent: unknown,
        upload: (content: unknown) => Promise<void>
    }
) => Promise<void>;

const uploadPageDefaultProcessor: UploadPageProcessor = async function ({ newContent, upload }) {
    await upload(newContent);
}

async function processPage({
    projectOutputDataPathAlias,
    wikiDataPathAlias,
    processor = uploadPageDefaultProcessor
}: {
    projectOutputDataPathAlias: keyof typeof dataPaths,
    wikiDataPathAlias: keyof typeof dataPaths,
    processor?: UploadPageProcessor
}) {
    logInfo(chalk.magenta(`processing: ${chalk.bold(projectOutputDataPathAlias)}`));

    const projectOutputDataPath = dataPaths[projectOutputDataPathAlias];
    if (!('projectOutputFilePath' in projectOutputDataPath)) {
        logError("page upload failed: no project output file path defined in the project output data path", {
            throwErr: true
        });
        throw ''//type guard 
    }

    const wikiDataPath = dataPaths[wikiDataPathAlias];
    if (!('wikiPage' in wikiDataPath)) {
        logError("page upload failed: no wiki page defined in the wiki data path", {
            throwErr: true
        });
        throw ''//type guard
    }

    const wikiPageUrl = constructWikiPageUrl(wikiDataPath.wikiPage);
    const projectOutputAbsFilePath = path.resolve(path.join(projectRelPaths.outputData, projectOutputDataPath.projectOutputFilePath));

    logInfo(chalk.gray(`local source: ${projectOutputAbsFilePath}`));
    logInfo(chalk.gray(`wiki endpoint: ${encodeURI(wikiPageUrl)}`));

    if (!fs.existsSync(projectOutputAbsFilePath)) {
        logError("page upload failed: local project output path doesn't exist", { throwErr: true });
        throw '' //type guard
    }

    let newContent;
    try {
        newContent = fs.readJsonSync(projectOutputAbsFilePath);
    } catch (err) {
        logError("page upload failed: failed to parse local project output path file contents to json", { throwErr: err });
        throw '' //type guard
    }


    logInfo('downloading current content');

    const currentPageContentRaw = await getArticle(wikiDataPath.wikiPage);
    let currentPageContent;
    let currentPageContentStr;
    if (currentPageContentRaw === undefined) {
        logInfo(chalk.yellow(`${chalk.bold('[WARN]:')} wiki page doesn't exist`));

        currentPageContent = undefined;
        currentPageContentStr = '';
    } else {
        try {
            currentPageContent = JSON.parse(currentPageContentRaw);
            currentPageContentStr = JSON.stringify(currentPageContent);
        } catch (err) {
            logError("page upload failed: failed to parse page content from the wiki page to json", { throwErr: err });
            throw '' //type guard
        }
    }


    logInfo('running processing');

    await processor({
        currentContent: currentPageContentRaw,
        newContent,
        async upload(content) {
            const contentStr = JSON.stringify(content);

            const isUploadedNeeded = currentPageContentRaw === undefined || currentPageContentStr !== contentStr;
            if (!isUploadedNeeded) {
                logInfo(chalk.bold.green("no changes to upload"));

                return;
            }


            logInfo(chalk.bold.magenta("uploading new changes"));

            await editPage(
                wikiDataPath.wikiPage,
                `AUTOMATED: sync to UPSTREAM commit #${ss14RepoCurrentCommitShortHash}${runUrl ? ` using action ${runUrl}` : ''}`,
                JSON.stringify(content, null, 4)
            );

            logInfo(chalk.bold.green("upload complete!"));
        }
    });
}