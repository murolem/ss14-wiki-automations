import { Logger } from '$logger';
import { z } from 'zod';
import chalk from 'chalk';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getProcessingContext, getWikiContext } from '$wiki/lib/bunnies/lib/context';
import { jsonComparatorAsc } from '$utils/writeJson';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { tryGetComp, tryGetCompWithParse } from '$process/processors/entity/getComp';
import { locRecordProperty } from '$process/processors/locale';
const logger = new Logger("wiki/preprocess/entities");
const { logDebug, logInfo, logWarn, logFatalAndThrow } = logger;

export default generateProcessorRunner(
    'lathe_recipe',
    'wiki_upload',
    'wiki_upload_temp',
    processor
);

function processor({
    project,
    projectDirpath,
    step,
    tempStep,
    outputDirpath,
    tempDirpath,
    stepDirpaths,
    logger,
    writeJsonSync,
}: ProcessorArgs) {
    const ictxLatheEnts = getProcessingContext('lathe_entity', 'lathe_entities_json');
    const ictxLatheRecipes = getProcessingContext('lathe_recipe', 'recipes_json');
    const ictxLatheRecipePacks = getProcessingContext('lathe_recipe', 'recipe_packs_json');
    const octxLatheRecipeMapOfRecipeIdToRecipe = getWikiContext('lathe_recipe', 'recipe_map_of_recipe_id_to_recipe');
    const octxLatheRecipeMapOfProductIdToRecipeId = getWikiContext('lathe_recipe', 'recipe_map_of_product_id_to_recipe_id');
    const octxLathesConfigs = getWikiContext('crafting_station_lathes_configs', 'lathes_configs');

    const latheEnts = ictxLatheEnts.loadAndParseData();
    const latheRecipes = ictxLatheRecipes.loadAndParseData();
    const latheRecipePacks = ictxLatheRecipePacks.loadAndParseData();

    // localize names for recipes
    latheRecipes.forEach(recipe => locRecordProperty(recipe, { property: 'name' }));
    writeJsonSync(
        'temp',
        "recipes_localized_json",
        latheRecipes
    );

    octxLatheRecipeMapOfRecipeIdToRecipe.writeData(
        latheRecipes.reduce<
            z.infer<typeof octxLatheRecipeMapOfRecipeIdToRecipe.schema>
        >((accum, r) => {
            accum[r.id] = r;

            if (r.materials) {
                for (const material in r.materials) {
                    r.materials[material] /= 100;
                }
            }

            return accum;
        }, {}),
        jsonComparatorAsc
    );

    octxLatheRecipeMapOfProductIdToRecipeId.writeData(
        latheRecipes.reduce<
            z.infer<typeof octxLatheRecipeMapOfProductIdToRecipeId.schema>
        >((accum, r) => {
            if (r.result) {
                const prop = getObjPropOrCreate(accum, r.result, () => r.id);
                if (Array.isArray(prop))
                    prop.push(r.id);
            }

            if (r.resultReagents) {
                for (const reag in r.resultReagents) {
                    const prop = getObjPropOrCreate(accum, reag, () => r.id);
                    if (Array.isArray(prop))
                        prop.push(r.id);
                }
            }

            return accum;
        }, {}),
        jsonComparatorAsc
    );

    const findRecipePackRecipes = (packId: string): string[] => {
        const res = latheRecipePacks.find(pack => pack.id === packId);
        if (!res) {
            logFatalAndThrow({ msg: `recipe pack '${packId}' not found` });
            throw ''//type guard
        }

        return res.recipes;
    }

    octxLathesConfigs.writeData(
        latheEnts
            .filter(ent => !ent.abstract)
            .map(ent => {
                const latheComp = tryGetCompWithParse(ent, 'Lathe');
                const emagRecipesComp = tryGetCompWithParse(ent, 'EmagLatheRecipes');

                return {
                    stationType: 'Lathe',
                    id: ent.id,
                    defaultProductionAmount: latheComp?.defaultProductionAmount,
                    materialUseMultiplier: latheComp?.materialUseMultiplier,
                    timeMultiplier: latheComp?.timeMultiplier,
                    staticRecipes: latheComp?.staticPacks?.flatMap(findRecipePackRecipes),
                    dynamicRecipes: latheComp?.dynamicPacks?.flatMap(findRecipePackRecipes),
                    emagStaticRecipes: emagRecipesComp?.emagStaticPacks?.flatMap(findRecipePackRecipes),
                    emagDynamicRecipes: emagRecipesComp?.emagDynamicPacks?.flatMap(findRecipePackRecipes)
                };
            })
    )
}
