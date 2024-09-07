import yaml, { YAMLException } from 'js-yaml';
import fs, { stat } from 'fs-extra';
import path, { parse } from 'path';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z, ZodArray, ZodObject, ZodType } from 'zod';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { latheCategoryValidator, latheRecipeValidator } from '$src/schemas/recipes/lathe';
import { latheEntityValidator } from '$src/schemas/entities/lathe';
import { assertPathExists, convertFilepathToFileEntryFromRecursiveFileFunctions, deepCloneObjectUsingJson, FileEntryFromRecursiveFileFunctions, getFilesInDirectoryRecursively, roundToDigit } from '$src/utils';
import { DataPath, dataPaths, extendedLogging, projectRelPaths } from '$src/preset';
import { resolveInheritance } from '$src/schemas/utils';
import { entitiyProcessedValidator, entityFilteringBasicValidator, entityValidator } from '$src/schemas/entities/entity';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
const logger = new Logger("03-parse-converted-data");
const { logInfo, logError, logWarn } = logger;

if (fs.existsSync(projectRelPaths.outputData)) {
    fs.emptyDirSync(projectRelPaths.outputData);
} else {
    fs.ensureDirSync(projectRelPaths.outputData)
}

logInfo(chalk.bold("processing converted data"));

// lathe recipe categories
const lathesCategories = processAndSaveConvertedData({
    convertedDataPathAlias: 'recipes.lathes.categories',
    outputDataPathAlias: 'recipes.lathes.categories',
    processor({ files, parseFiles, writeToOutput }) {
        const resultingEntries = parseFiles(files, latheCategoryValidator);

        writeToOutput(resultingEntries);

        return resultingEntries;
    }
});

// lathe machines
const lathesMachines = processAndSaveConvertedData({
    convertedDataPathAlias: 'entities.source.structures.machines.lathes',
    outputDataPathAlias: 'entities.source.structures.machines.lathes',
    processor({ files, parseFiles, writeToOutput }) {
        const resultingEntries = parseFiles(files, latheEntityValidator);

        writeToOutput(resultingEntries);

        return resultingEntries;
    }
});

// recipes that lathes have grouped by availability
const lathesRecipeIdsByLathe = (() => {
    const lathesRecipes: Record<string, {
        staticRecipes?: string[],
        dynamicRecipes?: string[],
        emagStaticRecipes?: string[],
        emagDynamicRecipes?: string[],
        hasRecipeWithId(itemId: string): boolean,
        staticAndDynamicRecipesMaterialUseMultiplier: number,
        staticAndDynamicRecipesTimeMultiplier: number
    }> = {};

    for (const lathe of lathesMachines) {
        const latheRecipes = {
            hasRecipeWithId(recipeId: string): boolean {
                return ([
                    'staticRecipes',
                    'dynamicRecipes',
                    'emagStaticRecipes',
                    'emagDynamicRecipes'
                ] as Array<keyof typeof lathesRecipes[string]>)
                    // @ts-ignore
                    .some(recipeCategory => lathesRecipes[lathe.id][recipeCategory]?.includes(recipeId));
            },
            staticAndDynamicRecipesMaterialUseMultiplier: 1,
            staticAndDynamicRecipesTimeMultiplier: 1
        } as typeof lathesRecipes[string];

        lathesRecipes[lathe.id] = latheRecipes;

        // ================

        const latheComponent = lathe.components.find(component => component.type === 'Lathe');
        if (latheComponent) {
            if ('staticRecipes' in latheComponent) {
                latheRecipes.staticRecipes = latheComponent.staticRecipes;
            }

            if ('dynamicRecipes' in latheComponent) {
                latheRecipes.dynamicRecipes = latheComponent.dynamicRecipes;
            }

            if ('timeMultiplier' in latheComponent) {
                latheRecipes.staticAndDynamicRecipesTimeMultiplier = latheComponent.timeMultiplier!;
            }

            if ('materialUseMultiplier' in latheComponent) {
                latheRecipes.staticAndDynamicRecipesMaterialUseMultiplier = latheComponent.materialUseMultiplier!;
            }
        }

        const emagLatheComponent = lathe.components.find(component => component.type === 'EmagLatheRecipes');
        if (emagLatheComponent) {
            if ('emagStaticRecipes' in emagLatheComponent) {
                latheRecipes.emagStaticRecipes = emagLatheComponent.emagStaticRecipes;
            }

            if ('emagDynamicRecipes' in emagLatheComponent) {
                latheRecipes.emagDynamicRecipes = emagLatheComponent.emagDynamicRecipes;
            }
        }
    }

    return lathesRecipes;
})();

// lathe items recipes grouped by lathe
processAndSaveConvertedData({
    convertedDataPathAlias: 'recipes.lathes',
    outputDataPathAlias: 'recipes.lathes',
    processor({ files, parseFiles, writeToOutput }) {
        // skip lathe categories - they are processed separately
        files = files.filter(file => file.relFilepath !== path.parse(dataPaths['recipes.lathes.categories'].projectConvertedPath).base);

        // all recipes for all lathes
        const parsedRecipes = parseFiles(files, latheRecipeValidator);

        // recipes grouped by lathe for all lathes, processed
        const recipesByLathe = parsedRecipes
            // create copies so that we do not modify the parsed recipes array
            .map(recipe => deepCloneObjectUsingJson(recipe) as z.infer<typeof latheRecipeValidator>)
            // resolve inheritance where needed, 
            .map((recipe, i, entries) => {
                if (recipe.parent) {
                    return resolveInheritance(recipe, parsedRecipes, 'parent', 'id');
                } else {
                    return recipe;
                }
            })
            // remove abstract recipes, since they are only used for inheritance
            .filter(recipe => !recipe.abstract)
            // removing "parent" prop since it's only used for inheritance and that's already resolved
            // divide material costs by 100 so they become accurate to the count.
            .map(recipe => {
                delete recipe.parent;

                if (!recipe.materials) {
                    logError(`failed to process and save converted data for a lathe: recipe ${chalk.bold(recipe.id)} doesn't have materials`, {
                        throwErr: true
                    });
                    throw '' // type guard
                }

                for (const material in recipe.materials) {
                    recipe.materials[material] /= 100;
                }

                return recipe;
            })
            // convert to a record with lathe IDs being the keys, and lathe recipes by item IDs they produce being the values.
            .reduce((accum, recipe) => {
                const recipeProduct = recipe.result;
                if (!recipeProduct) {
                    logWarn(chalk.yellow(`${chalk.bold('WARN:')} skipping recipe ${chalk.bold(recipe.id)} because it doesn't have a product`));
                    return accum;
                }

                // search for all lathes that have this recipe
                const latheIdsWithThisRecipe = Object.keys(lathesRecipeIdsByLathe)
                    .filter(latheId => {
                        return lathesRecipeIdsByLathe[latheId].hasRecipeWithId(recipe.id);
                    });

                if (latheIdsWithThisRecipe.length === 0) {
                    logInfo(chalk.gray(`skipping recipe ${chalk.bold(recipe.id)} because it doesn't belong to any lathe`));
                    return accum;
                }

                for (const latheId of latheIdsWithThisRecipe) {
                    const latheRecipes = lathesRecipeIdsByLathe[latheId];

                    // make a clone so we can make individual changes to this particular instance
                    const recipeCloned = deepCloneObjectUsingJson(recipe) as typeof recipe;

                    // assign availability
                    if (latheRecipes.staticRecipes?.includes(recipe.id)) {
                        recipeCloned.availability = 'static';
                    } else if (latheRecipes.dynamicRecipes?.includes(recipe.id)) {
                        recipeCloned.availability = 'dynamic';
                    } else if (latheRecipes.emagStaticRecipes?.includes(recipe.id)) {
                        recipeCloned.availability = 'emag static';
                    } else if (latheRecipes.emagDynamicRecipes?.includes(recipe.id)) {
                        recipeCloned.availability = 'emag dynamic';
                    } else {
                        logError(`failed to process and save converted data for a lathe: recipe ${chalk.bold(recipe.id)} belong to lathe ${latheId}, but it has unknown availability`, {
                            throwErr: true
                        });
                        throw '' // type guard
                    }

                    // adjust material cost and completion time if needed based on modifiers.
                    if (latheRecipes.staticAndDynamicRecipesMaterialUseMultiplier !== 1) {
                        for (const [material, cost] of Object.entries(recipeCloned.materials!)) {
                            // in the game, material cost is rounded up to 2 digits
                            recipeCloned.materials![material] = roundToDigit(cost * latheRecipes.staticAndDynamicRecipesMaterialUseMultiplier, 2);
                        }
                    }

                    if (latheRecipes.staticAndDynamicRecipesTimeMultiplier !== 1 && recipeCloned.completetime !== undefined) {
                        recipeCloned.completetime *= latheRecipes.staticAndDynamicRecipesTimeMultiplier;
                    }

                    // add recipe to lathe
                    if (!accum[latheId]) {
                        accum[latheId] = {}
                    }

                    accum[latheId][recipeProduct] = recipeCloned
                    delete (recipeCloned as any).type;
                    delete (recipeCloned as any).result;
                }

                return accum;
            }, {} as Record<string, Record<string, z.infer<typeof latheRecipeValidator>>>);


        writeToOutput(recipesByLathe);
    }
});

// =================

// entities

/** list of all entities. */
const enititesList: z.infer<typeof entityValidator>[] = [];
const enititesListExcludingInheritanceSpecific: z.infer<typeof entityValidator>[] = [];
const entityIdsByDataPathAlias: Record<string, string> = {}

function addEntitiesToEntitiesList(
    dataPathAlias: keyof typeof dataPaths,
    entitiesToAdd: z.infer<typeof entityValidator>[],
    {
        usedForInheritanceOnly = false
    }: Partial<{
        usedForInheritanceOnly: boolean
    }> = {}
): void {
    enititesList.push(...entitiesToAdd);

    if (!usedForInheritanceOnly) {
        enititesListExcludingInheritanceSpecific.push(...entitiesToAdd);
    }

    for (const entity of entitiesToAdd) {
        if (entity.id) {
            entityIdsByDataPathAlias[entity.id] = dataPathAlias;
        }
    }
}

addEntitiesToEntitiesList('entities.source.objects', processAndSaveConvertedDataForEntity('entities.source.objects'));
addEntitiesToEntitiesList('entities.source.clothing', processAndSaveConvertedDataForEntity('entities.source.clothing'));
addEntitiesToEntitiesList('entities.source.structures', processAndSaveConvertedDataForEntity('entities.source.structures'));
addEntitiesToEntitiesList('entities.source.tiles', processAndSaveConvertedDataForEntity('entities.source.tiles'));
addEntitiesToEntitiesList('entities.source.mobs', processAndSaveConvertedDataForEntity('entities.source.mobs'));
addEntitiesToEntitiesList('entities.source.body.organs', processAndSaveConvertedDataForEntity('entities.source.body.organs'));
addEntitiesToEntitiesList('entities.source.body.parts', processAndSaveConvertedDataForEntity('entities.source.body.parts'));
addEntitiesToEntitiesList('entities.source.debugging', processAndSaveConvertedDataForEntity('entities.source.debugging'));
addEntitiesToEntitiesList('entities.source.catalog.fills', processAndSaveConvertedDataForEntity('entities.source.catalog.fills'));

// entities only used for inheritance
// these are to be excluded from being uploaded to the wiki
addEntitiesToEntitiesList('entities.source.foldable', processAndSaveConvertedDataForEntity('entities.source.foldable'), { usedForInheritanceOnly: true });
addEntitiesToEntitiesList('entities.source.store.presets', processAndSaveConvertedDataForEntity('entities.source.store.presets'), { usedForInheritanceOnly: true });
addEntitiesToEntitiesList('entities.source.inventory-templates.inventorybase', processAndSaveConvertedDataForEntity('entities.source.inventory-templates.inventorybase'), { usedForInheritanceOnly: true });
addEntitiesToEntitiesList('entities.source.markers', processAndSaveConvertedDataForEntity('entities.source.markers'), { usedForInheritanceOnly: true });

// save imported entities
processAndSaveConvertedData({
    operationBeforeStartLog: 'saving ALL imported entities',
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'entities.before-processing.all-entities-array',
    processor({ files, parseFiles, writeToOutput }) {
        writeToOutput(enititesList);
    }
});

logInfo('processing entities')

// create a record mapping entity IDs to actual enitites
const entitiesProcessed = enititesListExcludingInheritanceSpecific
    // create a copy of each entity so that TS won't complain <3
    // and to not affect original entities.
    .map(entry => deepCloneObjectUsingJson(entry) as z.infer<typeof entityValidator>)
    // resolve inheritance where needed
    .map(entry => {
        if (entry.parent) {
            // for inheritance resolving, use the full list of entities
            return resolveInheritance(entry, enititesList, 'parent', 'id', {
                debugLogChain: extendedLogging["processConvertedData.inheritance-chain"],
                excludeProperties: ['abstract']
            });
        } else {
            return entry;
        }
    })
    // remove abstract entities
    // and entities without IDs (these are used for inheritance)
    .filter(entity => {
        return (entity.abstract === undefined || entity.abstract === false)
            && entity.id !== undefined;
    })
    // remove entities without names
    .filter(entity => {
        if (entity.name === undefined) {
            logInfo(chalk.gray(`skipping entity without name: ID ${chalk.bold(entity.id)} from ${chalk.bold(entityIdsByDataPathAlias[entity.id!])}`));
            return;
        }

        return true;
    });

// save processed entities
processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'entities.processed.all-entities-array',
    processor({ files, parseFiles, writeToOutput }) {
        writeToOutput(entitiesProcessed);
    }
});

logInfo('generating entity mapping ID → name');

// create a record mapping entity IDs to their names
const entityNamesByEntityIds = entitiesProcessed
    .reduce((accum, entity) => {
        accum[entity.id!] = entity.name!;

        return accum;
    }, {} as Record<string, string>);

processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'entities.processed.entity-names-by-entity-ids',
    processor({ files, parseFiles, writeToOutput }) {
        writeToOutput(entityNamesByEntityIds);
    }
});


logInfo('generating entity mapping name → ID');

// create a record mapping entity names to their IDs.
// names are made lowercase.
const entityIdsByEntityNames = entitiesProcessed
    .reduce((accum, entity) => {
        const nameLowercase = entity.name!.toLocaleLowerCase();

        // skip entities with names that already have been mapped.
        if (accum[nameLowercase]) {
            if (extendedLogging['processConvertedData.currently-being-parsed-files']) {
                logInfo(chalk.gray(`skipping entity for mapping names → IDs: ID ${chalk.bold(entity.id)} cause the name has already mapped been to entity by ID ${chalk.bold(accum[entity.name!])}`));
            }

            return accum;
        }

        accum[nameLowercase] = entity.id!;

        return accum;
    }, {} as Record<string, string>);

processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'entities.processed.entity-ids-by-lowercase-entity-names',
    processor({ files, parseFiles, writeToOutput }) {
        writeToOutput(entityIdsByEntityNames);
    }
});


function processAndSaveConvertedDataForEntity(
    dataPathAlias: keyof typeof dataPaths,
) {
    return processAndSaveConvertedData({
        convertedDataPathAlias: dataPathAlias,
        outputDataPathAlias: dataPathAlias,
        processor({ files, parseFiles, writeToOutput }) {
            const entities = parseFiles(files,
                entityFilteringBasicValidator,
                entityValidator
            );

            writeToOutput(entities);

            return entities;
        }
    });
}


// =====================


// // lathe recipes

// /**
//  * Parses files in the converted data directory, reducing them to a single array (or otherwise, if `afterDoneTransform` is defined)
//  * and saving to the parsed data directory.
//  *
//  * Directory with files to parse is specified via `inputDirpath`, with the file output path set in `outputFilepath`.
//  * Provide a Zod validator in `entryValidator`, with optional `localizator` function for translating strings.
//  *
//  * Use `relFilepathsBlacklist` to keep files from being parsed, or `relFilepathsWhitelist` to include only the specified files
//  * to the parsing.
//  *
//  * To transform the resulting array of entries in any way, use `afterDoneTransform`.
//  *
//  * @returns The resulting data.
//  */
// function parseAndSaveConvertedData<
//     ZodValidator extends ZodType,
//     ZodValidatorInferred extends z.infer<ZodValidator>
// >({
//     inputDirpath,
//     outputFilepath,
//     entryValidator,
//     localizator = noop,
//     relFilepathsBlacklist = [],
//     relFilepathsWhitelist = [],
//     afterDoneTransform = null
// }: {
//     /** Path inside the converted data directory to the directory with files that need to be parsed. */
//     inputDirpath: string,

//     /** Path inside the parsed data directory to the file that will contain the parsed data. */
//     outputFilepath: string,

//     /**
//      * A Zod validator used for validating and parsing each entry inside each found file.
//      */
//     entryValidator: ZodValidator,

//     /**
//      * A localizator function. Takes in each entry individually.
//      *
//      * @param relFilepath
//      * @param doc Input entry. These are entries inside each found file.
//      */
//     localizator?: (doc: z.infer<ZodValidator>, args: {
//         /** Path to the file that's being processed. This is an absolute path. */
//         absFilepath: string,

//         /** Filename. */
//         filename: string,

//         /**
//          * Path to the directory containing the file that's being processed.
//          * This is a path relative to the converted data directory.
//         */
//         relDirpath: string,

//         /**
//          * Path to the file that's being processed.
//          * This is a path relative to the converted data directory.
//          */
//         relFilepath: string,

//         /** An array of entries inside the file that's currently being parsed. */
//         docArray: Array<ZodValidatorInferred>,
//     }) => void,

//     /**
//      * A list of filepaths to exclude from processing, relative to the converted data directory.
//      *
//      * If set with `relFilepathsWhitelist`, will still be applied.
//      */
//     relFilepathsBlacklist?: string[],

//     /**
//      * A list of filepaths to only include to processing.
//      * If set, all other files not specified here will be ignored.
//      */
//     relFilepathsWhitelist?: string[],

//     /** A transform function applied to the resulting entries. */
//     afterDoneTransform?: null | ((entries: ZodValidatorInferred[]) => unknown)
// }): unknown {
//     const inputDirAbsPath = path.resolve(projectRelPaths.convertedData, inputDirpath);
//     const outputFileAbsPath = path.resolve(projectRelPaths.outputData, outputFilepath);

//     if (!fs.existsSync(inputDirAbsPath)) {
//         throw new Error("failed to parse: input directory doesn't exist: " + inputDirAbsPath);
//     }

//     logInfo(`⭐ parsing files in directory: ${chalk.bold(inputDirpath)}`);
//     logInfo(`(${inputDirAbsPath})`);

//     if (relFilepathsWhitelist.length > 0) {
//         logInfo(chalk.blue(`WHITELIST mode`));
//     }

//     const inputFilepaths = getFilesInDirectoryRecursively(inputDirAbsPath)
//         .filter(({ relFilepath, absFilepath }) => {
//             // when not in whitelist mode, set to true, allowing any file to pass
//             const inWhitelist = relFilepathsWhitelist.length === 0 || relFilepathsWhitelist.includes(relFilepath);
//             if (!inWhitelist) {
//                 return;
//             }

//             const inBlacklist = relFilepathsBlacklist.includes(relFilepath);

//             if (inBlacklist) {
//                 logInfo(`file excluded: ${chalk.bold(relFilepath)}`);
//                 logInfo(`(${absFilepath})`);

//                 return;
//             }

//             return true;
//         });

//     const resultingEntries = [];
//     for (const [i, { relDirpath, filename, absFilepath, relFilepath }] of inputFilepaths.entries()) {
//         logInfo(`[${i + 1} of ${inputFilepaths.length}] parsing file: ${chalk.bold(relFilepath)}`);
//         logInfo(`(${absFilepath})`);

//         const parsedEntries = entryValidator.array()
//             .parse(fs.readJsonSync(absFilepath));

//         parsedEntries.forEach(entry => {
//             localizator(entry, {
//                 absFilepath,
//                 filename,
//                 relDirpath,
//                 relFilepath,
//                 docArray: parsedEntries,
//             })
//         });

//         resultingEntries.push(...parsedEntries);
//     }

//     logInfo(chalk.bold(`directory "${inputDirpath}" parsed! entries in total: ${resultingEntries.length}`));
//     logInfo(`(${outputFileAbsPath})`);

//     let result;
//     if (afterDoneTransform === null) {
//         result = resultingEntries;
//     } else {
//         logInfo(chalk.bold.blue("applying transform..."));

//         result = afterDoneTransform(resultingEntries)
//     }

//     fs.mkdirSync(path.parse(outputFileAbsPath).dir, { recursive: true });
//     fs.writeFileSync(outputFileAbsPath, JSON.stringify(result, null, 4));

//     return result;
// }

// /**
//  * Setups the FTL localizator function, based on the language code provided (e.g. `en-US`),
//  * consuming all FTL files inside `localizationFilesPaths` containing localized strings.
//  * @param lang Language code. Doesn't do much currently.
//  * @param localizationFilesPaths A list of FTL files filepaths. These are loaded and added to the localization dictionary
//  * to use by the localizer.
//  * @returns A localizer function. It takes in the document to localize (any object), and a field name containing the
//  * localization key. If the desired property lies somewhere within the document, define a function to perform the localization manually.
//  */
// function setupFtlLocalizator(lang: string, localizationFilesPaths: string[]) {
//     const localization = new FluentBundle(lang);
//     for (const filepath of localizationFilesPaths) {
//         const resource = new FluentResource(fs.readFileSync(filepath).toString());
//         localization.addResource(resource);
//     }

//     /**
//      * Localizes given value.
//      *
//      * @returns the localized value.
//      * @returns `null`, if the value is unknown in the localization.
//      * */
//     function localizeValue(value: string): string | null {
//         const valuePattern = localization.getMessage(value)?.value;
//         if (!valuePattern) {
//             return null;
//         }

//         const valueString = localization.formatPattern(valuePattern);
//         return valueString;
//     }

//     type LocalizeFn = typeof localizeValue;

//     return function localizeDocField<T extends Record<string, unknown>>(
//         /** Document to localize a field in. */
//         doc: T,

//         /**
//          * A field name to localize, if it's one the first level.
//          * Otherwise a function, in which you must manually extract the desired field's value from the document,
//          * localize it with the `localize` function and set it back in the document.
//          */
//         fieldNameOrFieldLocalizationFn: string | ((doc: T, localize: LocalizeFn) => void)
//     ): void {
//         if (typeof fieldNameOrFieldLocalizationFn === 'string') {
//             const fieldName = fieldNameOrFieldLocalizationFn;

//             if (!(fieldName in doc)) {
//                 return;
//             }

//             const fieldValue = doc[fieldName];
//             if (typeof fieldValue !== 'string') {
//                 logError(`failed to localize: expected the field to be a string, received ${typeof fieldValue}`, {
//                     throwErr: true,
//                     additional: {
//                         fieldName,
//                         fieldValue,
//                         doc
//                     }
//                 })
//                 throw '' // type guard
//             }

//             const result = localizeValue(fieldValue);
//             if (result !== null) {
//                 // @ts-ignore checked above
//                 doc[fieldName] = result;
//             }
//         } else {
//             const fieldLocalizationFn = fieldNameOrFieldLocalizationFn;

//             fieldLocalizationFn(doc, localizeValue);
//         }
//     }
// }

// // ==========

// const localeFiles = getFilesInDirectoryRecursively(path.join(projectRelPaths.inputData, 'locale'));

// const localizator = setupFtlLocalizator(
//     'en-US',
//     localeFiles.map(file => file.absFilepath)
// );

// function parseLatheRecipes(outputProjectParsedDataFilepath: string, entryFilter: (entry: z.infer<typeof latheRecipeValidator>) => boolean): void {
//     // recipes → lathe (excluding categories)
//     // these contain all -lathe-related recipes,
//     // including: autolate, protolate etc.
//     parseAndSaveConvertedData({
//         inputDirpath: projectInputDataDirPaths['recipes.lathes'],
//         outputFilepath: projectOutputDataFilePaths['recipes.autolathe'],
//         entryValidator: latheRecipeValidator,
//         // contains lathe recipe categories, which requires a separate validator
//         relFilepathsBlacklist: ['categories.json'],
//         localizator: doc => localizator(doc, 'name'),
//         afterDoneTransform: entries => {
//             const matchingEntries = entries.filter(entry => entryFilter(entry));

//             // normalize the material cost
//             matchingEntries.forEach(entry => {
//                 Object.entries(entry.materials).forEach(([material, count]) => {
//                     entry.materials[material] = count / 100
//                 })
//             });

//             return matchingEntries;
//         }
//         // afterDoneTransform: entries => {
//         //     // transform resulting entries into a record
//         //     const transformed = entries.reduce((accum, entry) => {
//         //         const entryClone = jsonClone(entry) as typeof entry;
//         //         accum[entry.id] = entryClone;
//         //         // @ts-ignore schema validated at the end
//         //         delete entryClone.id;

//         //         return accum;
//         //     }, {} as Record<string, unknown>);

//         //     // validate the resulting record
//         //     return latheRecipeAfterParseValidator.parse(transformed);
//         // },
//     })
// }

// // recipes → lathe entity config
// const latheEntityConfig = LatheEntityValidator.array().parse(
//     parseAndSaveConvertedData({
//         inputDirpath: path.join('prototypes', 'entities', 'structures', 'machines'),
//         outputFilepath: path.join('prototypes', 'entities', 'structures', 'machines', 'lathe.json'),
//         entryValidator: LatheEntityValidator,
//         relFilepathsWhitelist: ['lathe.json']
//     })
// );


// parseLatheRecipes(
//     projectOutputDataFilePaths['recipes.autolathe'],
//     entry => {
//         const matchingLatheEntityConfigEntry = latheEntityConfig
//             .find(latheEntity => latheEntity.id == 'Autolathe');

//         // todo error handling

//         const latheComponent = matchingLatheEntityConfigEntry?.components
//             .find(comp => comp.type === 'Lathe');
//         const staticRecipes = latheComponent.staticRecipes;

//         const dynamicRecipes = latheComponent.dynamicRecipes;
//     }
// )

// // recipes → lathe recipe categories
// parseAndSaveConvertedData({
//     inputDirpath: path.join('recipes', 'lathe'),
//     outputFilepath: path.join('recipes', 'lathe_categories' + '.json'),
//     entryValidator: latheCategoryValidator,
//     relFilepathsWhitelist: ['categories.json'],
//     localizator: doc => localizator(doc, 'name')
// });

// logInfo(chalk.bold(`parsing for all complete!`));