import fs from 'fs-extra';
import path from 'path';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
import { deepCloneObjectUsingJson, roundToDigit } from '$src/utils';
import { dataPaths, extendedLogging, projectRelPaths } from '$src/preset';
import { resolveInheritance } from '$src/schemas/utils';
import { researchTechValidator } from '$src/schemas/research/tech';
import { researchDisciplineValidator } from '$src/schemas/research/discipline';
import { localizeRecordProperty } from '$src/03-process-converted-data/localizer';
import { entityDefiningValidator, entityValidator } from '$src/schemas/entities/entity';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { recipeValidator } from '$src/schemas/recipes/recipe';
import { latheCategoryValidator } from '$src/schemas/recipes/lathe';
const logger = new Logger("03-parse-converted-data");
const { logInfo, logError, logWarn } = logger;

logInfo(chalk.bold("processing converted data"));

if (fs.existsSync(projectRelPaths.outputData)) {
    fs.emptyDirSync(projectRelPaths.outputData);
} else {
    fs.ensureDirSync(projectRelPaths.outputData)
}

// =================
// RECIPES
// =================

// = === = === = === = === = === = === = === = === = === = === = === 
//  STEP 1: load and process all recipes from all possible sources =
// = === = === = === = === = === = === = === = === = === = === = === 

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
    convertedDataPathAlias: 'recipes.lathes.machines',
    outputDataPathAlias: 'recipes.lathes.machines',
    processor({ files, parseFiles, writeToOutput }) {
        const resultingEntries = parseFiles(files, entityValidator);

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

        if (!lathe.id) {
            logError("lathe ID is undefined", lathe, { throwErr: true });
            throw ''//type guard
        }

        lathesRecipes[lathe.id] = latheRecipes;

        // ================

        const latheComponent = lathe.components?.find(component => component.type === 'Lathe');
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

        const emagLatheComponent = lathe.components?.find(component => component.type === 'EmagLatheRecipes');
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

type RecipeMethod = string;

type RecipesByMethod = Record<
    RecipeMethod,
    Array<z.infer<typeof recipeValidator>>
>;

// lathe items recipes grouped by lathe
const latheRecipesByLatheId = processAndSaveConvertedData({
    convertedDataPathAlias: 'recipes.lathes',
    outputDataPathAlias: 'recipes.lathes',
    processor({ files, parseFiles, writeToOutput }) {
        // all recipes for all lathes
        const parsedRecipes = parseFiles(files, recipeValidator);

        // recipes grouped by lathe for all lathes, processed
        const recipesByLatheId: RecipesByMethod = parsedRecipes
            // create copies so that we do not modify the parsed recipes array
            .map(recipe => deepCloneObjectUsingJson(recipe) as z.infer<typeof recipeValidator>)
            // resolve inheritance where needed, 
            .map((recipe, i, entries) => {
                if (recipe.parent) {
                    return resolveInheritance(recipe, parsedRecipes, 'parent', 'id', {
                        inheritedPropertiesToDiscard: ['abstract']
                    });
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
            // convert to a record with the final type
            .reduce((accum, recipe) => {
                if (recipe.result === undefined && recipe.resultReagents === undefined) {
                    logWarn(chalk.yellow(`${chalk.bold('WARN:')} skipping recipe ${chalk.bold(recipe.id)} because it doesn't have a product: neither an item nor reagents`));
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
                    let recipesByLathe = accum[latheId];
                    if (!recipesByLathe) {
                        recipesByLathe = []
                        accum[latheId] = recipesByLathe;
                    }

                    recipesByLathe.push(recipeCloned);
                }

                return accum;
            }, {} as typeof recipesByLatheId);


        writeToOutput(recipesByLatheId);

        return recipesByLatheId;
    }
});

// === = === = === = === = === = === = === = === = === = === = === = === = === = === = === = === =
//  STEP 2: gather all imported recipes into a single record,                                    =
//          grouping them by production method.                                                  =
// === = === = === = === = === = === = === = === = === = === = === = === = === = === = === = === =

const recipesByMethod: RecipesByMethod = {}

// function getRecipeArrayByMethodFromRecipesByProductionMethod(productionMethod: string): typeof recipesByProductionMethod[string] {
//     let arr: undefined | typeof recipesByProductionMethod[string] = recipesByProductionMethod[productionMethod];
//     if (!arr) {
//         arr = [];
//         recipesByProductionMethod[productionMethod] = arr;
//     }

//     return arr;
// }

// copy lathe recipes over to the unified recipes record
Object.entries(latheRecipesByLatheId)
    .forEach(([latheId, recipes]) => {
        recipesByMethod[latheId] = deepCloneObjectUsingJson(recipes) as typeof recipes;
    });

// === = = === = = === = = === = = === 
//  STEP 3: generate recipes files ===
// === = = === = = === = = === = = === 

// ::file 1: recipes by recipe IDs
processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'recipes.recipes by recipe IDs',
    processor({ writeToOutput }) {
        const recipesByRecipeIds = Object.values(recipesByMethod)
            .reduce((accum, recipes) => {
                recipes
                    .forEach(recipe => {
                        // make a clone so we can make changes to it
                        const recipeCloned = deepCloneObjectUsingJson(recipe) as typeof recipe;

                        // assign to ID
                        accum[recipe.id] = recipeCloned;

                        // remove availability
                        delete recipeCloned.availability;
                    });

                return accum;
            }, {} as Record<string, z.infer<typeof recipeValidator>>);

        writeToOutput(recipesByRecipeIds);
    }
});

// ::file 2: recipe IDs by product IDs
processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'recipes.recipe IDs by product IDs',
    processor({ writeToOutput }) {
        const recipeIdsByProductIds: Record<string, string | string[]> = {}

        function addRecipeIdByProductId(productId: string, recipeId: string): void {
            const matchByProductId: undefined | typeof recipeIdsByProductIds[string] = recipeIdsByProductIds[productId]
            if (matchByProductId === undefined) {
                // if the product ID hasn't been added - add it
                recipeIdsByProductIds[productId] = recipeId;
            } else if (typeof matchByProductId === 'string') {
                // if the product ID was added and it's value is a string,
                // then it's value is a recipe ID.
                // convert value to array so that a single product ID can map to multiple recipes

                // check if we're not adding a duplicate recipe ID
                if (recipeId !== matchByProductId) {
                    recipeIdsByProductIds[productId] = [matchByProductId, recipeId];
                }
            } else {
                // if the product ID was added and it's an array,
                // then it already holds multiple recipe IDs.
                // just push ours in

                // check if we're not adding a duplicate recipe ID
                if (!matchByProductId.includes(recipeId)) {
                    matchByProductId.push(recipeId);
                }
            }
        }

        for (const recipes of Object.values(recipesByMethod)) {
            for (const recipe of recipes) {
                switch (recipe.type) {
                    case 'latheRecipe':
                        if (recipe.result !== undefined) {
                            addRecipeIdByProductId(recipe.result, recipe.id);
                        }

                        if (recipe.resultReagents !== undefined) {
                            for (const reagentId of Object.keys(recipe.resultReagents)) {
                                addRecipeIdByProductId(reagentId, recipe.id);
                            }
                        }
                        break;
                    default:
                        logError("failed to generate a list of recipe IDs by product IDs: unknown recipe type: " + recipe.type, {
                            throwErr: true,
                            additional: recipe
                        });
                        throw ''//type guard
                }
            }
        }

        writeToOutput(recipeIdsByProductIds);
    }
});

// ::file 3: recipe IDs by [production] method and availability
processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'recipes.recipe IDs by method and availability',
    processor({ writeToOutput }) {
        const recipeIdsByMethodAndAvailability: Record<string, Record<string, string[]>> = {}

        function addRecipeId(method: string, availability: string, recipeId: string): void {
            let recipesByMethod = recipeIdsByMethodAndAvailability[method];
            if (recipesByMethod === undefined) {
                recipesByMethod = {};
                recipeIdsByMethodAndAvailability[method] = recipesByMethod;
            }

            let recipesByAvailability = recipesByMethod[availability];
            if (recipesByAvailability === undefined) {
                recipesByAvailability = [];
                recipesByMethod[availability] = recipesByAvailability;
            }

            recipesByAvailability.push(recipeId);
        }

        for (const [method, recipes] of Object.entries(recipesByMethod)) {
            for (const recipe of recipes) {
                addRecipeId(method, recipe.availability!, recipe.id);
            }
        }

        writeToOutput(recipeIdsByMethodAndAvailability);
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
                inheritedPropertiesToDiscard: ['abstract']
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

// save generated mapping
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

// save generated mapping
processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'entities.processed.entity-ids-by-lowercase-entity-names',
    processor({ files, parseFiles, writeToOutput }) {
        writeToOutput(entityIdsByEntityNames);
    }
});


// =================

// research

const researchDisciplinesParsed = processAndSaveConvertedData({
    convertedDataPathAlias: 'research.disciplines.parsed',
    outputDataPathAlias: 'research.disciplines.parsed',
    processor({ files, parseFiles, writeToOutput }) {
        const parsedEntries = parseFiles(files, researchDisciplineValidator);

        for (const entry of parsedEntries) {
            // localize in place
            localizeRecordProperty(entry, { property: 'name' });
        }

        writeToOutput(parsedEntries);

        return parsedEntries;
    }
});

processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'research.disciplines.processed',
    processor({ writeToOutput }) {
        // a record mapping discipline ID → discipline
        const disciplinesByDisciplineId = researchDisciplinesParsed
            .reduce((accum, entry) => {
                accum[entry.id] = entry;

                // remove extra fields
                // @ts-ignore safe if we don't use this one further
                delete entry.type;
                // @ts-ignore same as above
                delete entry.id;

                return accum;
            }, {} as Record<string, unknown>);

        writeToOutput(disciplinesByDisciplineId);
    }
});


const researchTechsParsed = processAndSaveConvertedData({
    convertedDataPathAlias: 'research.techs.parsed',
    outputDataPathAlias: 'research.techs.parsed',
    processor({ files, parseFiles, writeToOutput }) {
        const parsedEntries = parseFiles(files, researchTechValidator);

        for (const entry of parsedEntries) {
            // localize in place
            localizeRecordProperty(entry, { property: 'name' });
        }

        writeToOutput(parsedEntries);

        return parsedEntries;
    }
});

processAndSaveConvertedData({
    convertedDataPathAlias: 'noop',
    outputDataPathAlias: 'research.techs.processed',
    processor({ writeToOutput }) {
        // a record mapping discipline ID → tech ID → tech
        const techsByTechIdByDisciplineId = researchTechsParsed
            .reduce((accum, entry) => {
                // assign to a discipline
                if (!accum[entry.discipline]) {
                    accum[entry.discipline] = {}
                }

                accum[entry.discipline][entry.id] = entry;

                // remove extra fields
                // @ts-ignore safe if we don't use this one further
                delete entry.type;
                // @ts-ignore same as above
                delete entry.id;
                // @ts-ignore same as above
                delete entry.discipline;

                return accum;
            }, {} as Record<string, Record<string, unknown>>);

        writeToOutput(techsByTechIdByDisciplineId);
    }
});



// ==================================
// big functions go below
// ==================================

function processAndSaveConvertedDataForEntity(
    dataPathAlias: keyof typeof dataPaths,
) {
    return processAndSaveConvertedData({
        convertedDataPathAlias: dataPathAlias,
        outputDataPathAlias: dataPathAlias,
        processor({ files, parseFiles, writeToOutput }) {
            const entities = parseFiles(files,
                entityDefiningValidator,
                entityValidator
            );

            writeToOutput(entities);

            return entities;
        }
    });
}