import { prototypeSchema } from '$schemas/prototype/base';
import { cargoProductProcessedProtoSchema } from '$schemas/prototype/prototypes/cargoProduct';
import { entityPrototypeSchema, wikiSchemaEntityMapOfIdToName, wikiSchemaEntityMapOfLcNameToId } from '$schemas/prototype/prototypes/entity';
import { toOsPath } from '$utils/toOsPath';
import path from 'path';
import { z, type ZodTypeAny } from 'zod';
import dotenv from 'dotenv';
import type { StringOr } from '$utils/stringOr';
import { latheRecipeProtoSchema, wikiSchemaRecipeMapOfRecipeIdToRecipe, wikiSchemaRecipeMapOfRecipeMethodToAvailabilityToToRecipeIds, wikiSchemaRecipeMapOfRecipeProductToRecipeId as wikiSchemaRecipeMapOfProductIdToRecipeId } from '$schemas/prototype/prototypes/latheRecipe';
import { latheRecipePackProtoSchema } from '$schemas/prototype/prototypes/latheRecipePack';
import { wikiSchemaCraftingStationConfig, wikiSchemaLatheConfig } from '$schemas/crafting/craftingStation';
dotenv.config();

const envVarsSchema = z.object({
    PR_MANAGE_GH_TOKEN: z.string(),
    WIKI_LOGIN: z.string(),
    WIKI_PASSWORD: z.string()
});
export const envVars = envVarsSchema.parse(process.env);

/** Controls extra logging. */
export const extendedLogging = {
    // not impl
    importSourceData: false,
    // not impl
    convertSourceDataToJson: false,

    "processConvertedData.currently-being-parsed-files": false,
    "processConvertedData.validators": false,
    "processConvertedData.inheritance-chain": false
}

export const preferredLocale: string = 'en-US';

// NOTE: this is also hardcoded into npm commands
export const ss14RepoGitUrl = 'https://github.com/space-wizards/space-station-14.git';

/** List of paths relative to the sync dir that should be excluded from the syncing process. */
export const syncBranchPathBlacklist = [
    "README.md"
];

/** 
 * Config regarding the repo this program resides in. 
 * Used to manage syncing branch PRs.
*/
export const wikiAutomationsRepo = {
    owner: "murolem",
    repo: "ss14-wiki-automations",
    // name of the syncing branch
    syncBranchName: "sync"
}

/** Name to use for git author. */
export const automationsGitAuthor = "Meowbot";

export const wikiServer = "wiki.spacestation14.com";
export const wikiApiPath = "/w";

// ==========

const cwd = process.cwd();
const tempDirPath = path.join(cwd, 'temp');

export type Project = keyof typeof projectDirnames;
/** Directory names of "projects" — logical blocks for grouping together similar resulting outputs. */
export const projectDirnames = {
    ss14_repo: '_ss14-repo',
    diff: '_diff',
    locale: 'locale',
    prototype: 'prototype',
    entity: 'entity',
    lathe_entity: 'lathe-entity',
    lathe_recipe: 'lathe-recipe',
    crafting_station_lathes_configs: 'crafting_station_lathes_configs',
    crafting_station: 'crafting-station',
    // item: 'item',
    // structure: 'structure',
    // item_recipe: 'item-recipe',
    // construction_recipe: 'construction-recipe',
    // reagent: 'reagent',
    cargo_order: 'cargo-order'
} satisfies Record<string, string>;

export type Step = keyof typeof stepDirnames;
/** 
 * Directory names for "steps" — logical steps of the process.
 * Each project has its own set of steps inside its directory.
 */
export const stepDirnames = {
    input: 'input',
    converted: 'converted',
    processed: 'processed',
    processed_temp: 'processed-temp',
    wiki_upload: 'wiki-upload',
    wiki_upload_temp: 'wiki-upload-temp',
    wiki_diff: 'wiki-diff'
} satisfies Record<string, string>;

/** Directory paths for projects. */
export const projectDirpaths = Object
    .entries(projectDirnames)
    .reduce<Record<Project, string>>((accum, [key, dirname]) => {
        accum[key as Project] = toOsPath(`${tempDirPath}/${dirname}`);
        return accum;
    }, {} as any);

/** Directory paths for project steps. */
export const projectStepDirpaths = Object
    .keys(projectDirnames)
    .reduce<Record<Project, Record<Step, string>>>((accum, project) => {
        accum[project as keyof typeof projectDirnames] = Object
            .entries(stepDirnames)
            .reduce<Record<Step, string>>((accum2, [step, stepDirname]) => {
                accum2[step as Step] = toOsPath(`${projectDirpaths[project as Project]}/${stepDirname}`);
                return accum2;
            }, {} as any);

        return accum;
    }, {} as any);




/** Describes a single output from a processing step. */
export type ProcessingStepOutput = {
    project: Project,
    name: StringOr<"">, // a nice trick to infer string literals
    /** A filepath relative to the project step directory.  */
    relFilepath: string,
    schema: ZodTypeAny
};

export type ProcessingStepOutputs = typeof processingStepOutputs;
export type ProcessingStepOutputName = ProcessingStepOutputs[number]['name'];
export type ProcessingStepOutputProject = ProcessingStepOutputs[number]['project'];
export type ProcessingStepOutputsByProject<T extends ProcessingStepOutputProject> =
    Extract<ProcessingStepOutputs[number], { project: T }>;
/** 
 * A list of processing step outputs.
 */
export const processingStepOutputs = [
    {
        project: 'prototype',
        name: 'prototypes_json',
        relFilepath: "prototypes.json",
        schema: prototypeSchema.array()
    },
    {
        project: 'entity',
        name: 'entities_json',
        relFilepath: "entities.json",
        schema: entityPrototypeSchema.array()
    },
    {
        project: 'cargo_order',
        name: 'orders_json',
        relFilepath: "orders.json",
        schema: cargoProductProcessedProtoSchema.array()
    },
    {
        project: 'lathe_entity',
        name: 'lathe_entities_json',
        relFilepath: "lathe_entities.json",
        schema: entityPrototypeSchema.array()
    },
    {
        project: 'lathe_recipe',
        name: 'recipes_json',
        relFilepath: "recipes.json",
        schema: latheRecipeProtoSchema.array()
    },
    {
        project: 'lathe_recipe',
        name: 'recipe_packs_json',
        relFilepath: "recipe_packs.json",
        schema: latheRecipePackProtoSchema.array()
    },
] satisfies ProcessingStepOutput[];

export const getProcessingOutput = <T extends ProcessingStepOutputProject>
    (project: T, name: ProcessingStepOutputsByProject<T>['name']) =>
    processingStepOutputs.find(e => e.project === project && e.name === name)!;

/** Describes a single output from a wiki step. */
export type WikiStepOutput = {
    project: Project,
    name: StringOr<"">, // a nice trick to infer string literals
    /** A filepath relative to the project step directory.  */
    relFilepath: string,
    /** 
     * Url to upload the file to.
     * Relative to the wiki endpoint.
    */
    wikipage?: string,
    schema: ZodTypeAny
};

export type WikiStepOutputs = typeof wikiStepOutputs;
export type WikiStepOutputName = WikiStepOutputs[number]['name'];
export type WikiStepOutputProject = WikiStepOutputs[number]['project'];
export type WikiStepOutputsByProject<T extends WikiStepOutputProject> =
    Extract<WikiStepOutputs[number], { project: T }>;

/** 
 * A list of wiki step outputs.
 */
export const wikiStepOutputs = [
    {
        project: 'entity',
        name: 'entity_map_of_id_to_name',
        relFilepath: 'entity_map_of_id_to_name.json',
        schema: wikiSchemaEntityMapOfIdToName,
        wikipage: 'Module:Item/data/auto/entity_map_of_id_to_name.json',
    },
    {
        project: 'entity',
        name: 'entity_map_of_lc_name_to_id',
        relFilepath: 'entity_map_of_lc_name_to_id.json',
        schema: wikiSchemaEntityMapOfLcNameToId,
        wikipage: 'Module:Item/data/auto/entity_map_of_lc_name_to_id.json',
    },
    {
        project: 'lathe_recipe',
        name: 'recipe_map_of_recipe_id_to_recipe',
        relFilepath: 'recipe_map_of_recipe_id_to_recipe.json',
        schema: wikiSchemaRecipeMapOfRecipeIdToRecipe,
        wikipage: 'Module:Item_recipe/data/auto/recipe_map_of_recipe_id_to_recipe.json',
    },
    {
        project: 'lathe_recipe',
        name: 'recipe_map_of_product_id_to_recipe_id',
        relFilepath: 'recipe_map_of_product_id_to_recipe_id.json',
        schema: wikiSchemaRecipeMapOfProductIdToRecipeId,
        wikipage: 'Module:Item_recipe/data/auto/recipe_map_of_product_id_to_recipe_id.json',
    },
    {
        project: 'crafting_station_lathes_configs',
        name: 'lathes_configs',
        relFilepath: 'lathes_configs.json',
        schema: wikiSchemaLatheConfig.array()
    },
    {
        project: 'crafting_station',
        name: 'crafting_stations_configs',
        relFilepath: 'crafting_stations_configs.json',
        schema: wikiSchemaCraftingStationConfig.array(),
        wikipage: 'Module:Crafting/data/auto/crafting_stations_configs.json',
    },
] satisfies WikiStepOutput[];

export const getWikiOutput = <T extends WikiStepOutputProject>
    (project: T, name: WikiStepOutputsByProject<T>['name']) =>
    wikiStepOutputs.find(e => e.project === project && e.name === name)!;

// /** 
//  * Maps wiki step projects to output names to absolute filepaths in the diff directory. 
//  * This is fully equivalent to {@link projectWikiOutputFilepaths} except for the filepaths.
//  * */
// export const projectWikiDiffFilepaths = Object
//     .keys(wikiStepOutputs)
//     .reduce<
//         Record<
//             ProjectWikiOutputsProject,
//             Record<
//                 ProjectWikiOutputName,
//                 string
//             >
//         >
//     >((accum, projectUntyped) => {
//         const project = projectUntyped as ProjectWikiOutputsProject;

//         accum[project] = Object
//             .entries(wikiStepOutputs[project])
//             .reduce<
//                 typeof projectWikiOutputFilepaths[ProjectWikiOutputsProject]
//             >((accum2, [outputName, output]) => {
//                 accum2[outputName as ProjectWikiOutputName]
//                     = path.join(projectDirpaths.diff, project, output.filepath);

//                 return accum2;
//             }, {} as any);

//         return accum;
//     }, {} as any);