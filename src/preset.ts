import { toOsPath } from '$utils/toOsPath';
import path from 'path';

const cwd = process.cwd();
const tempDirAbsPath = path.join(cwd, 'temp');

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

/** Paths used within the project. */
export const stepAbsDirPaths = {
    // NOTE: this is also hardcoded into npm commands
    ss14Repo: path.join(tempDirAbsPath, '00-ss14-repo'),

    /** Any data that's imported from the SS14 installation. */
    inputData: path.join(tempDirAbsPath, '01-input-data'),

    /** Input data converted to parsable formats. */
    convertedData: path.join(tempDirAbsPath, '02-converted-data'),

    /** 
     * Input data that was processed, producing a valuable output.
     */
    outputData: path.join(tempDirAbsPath, '03-parsed-data'),
} satisfies Record<string, string>

/** 
 * A map of substep names to their respective SS14 repo directories.
 * 
 * These are used for initial data copying (any data) and transform from YML to JSON (only YML files).
 * 
 * Directories are relative to the SS14 repo folder. Data from these directories
 * will be copied under the same paths into the source data dir, with YML data also 
 * transformed to JSON and placed again under the same path but in the converted data dir.
 */
export const sourceSubstepDirPaths = {
    locale: 'locale',

    reagents: 'reagents',
    items_reagents: 'items_reagents', // ?
    reactions: 'reactions',

    recipes_lathe: toOsPath('Resources/Prototypes/Recipes/Lathes'),
    recipes_lathe_packs: toOsPath('Resources/Prototypes/Recipes/Lathes/Packs'),
    recipes_lathe_categories: toOsPath('Resources/Prototypes/Recipes/Lathes/categories.yml'),
    recipes_lathe_machines: toOsPath('Resources/Prototypes/Entities/Structures/Machines/lathe.yml'),

    recipes_all_by_recipe_id: 'recipes_all_by_recipe_id',
    recipes_all_by_product_id: 'recipes_all_by_product_id',
    recipes_all_by_method_and_availability: '_________________',

    entities_foldable: 'entities_foldable',
    entities_clothing: 'entities_clothing',
    entities_objects: 'entities_objects',
    entities_structures: 'entities_structures',
    entities_tiles: 'entities_tiles',
    entities_mobs: 'entities_mobs',
    entities_body_organs: 'entities_body_organs',
    entities_body_parts: 'entities_body_parts',
    entities_debugging: 'entities_debugging',
    entities_store_presets: 'entities_store_presets',
    entities_catalog_fills: 'entities_catalog_fills',
    entities_inventory_templates_inventorybase: 'entities_inventory_templates_inventorybase',
    entities_markers: 'entities_markers',

    research_techs: 'research_techs',
    research_disciplines: 'research_disciplines',


    // // all entities parsed by a validator
    // "item.processed.entities.all-entities-raw-array": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'Before processing', 'Entities', 'all-entities-array.json'),
    // },

    // // all entities fully processed
    // "item.processed.entities.entities-array": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'all-entities-array.json'),
    // },

    // "item.processed.entities.entity-ids-by-lowercase-entity-names": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'entity-ids-by-lowercase-entity-names.json'),
    // },

    // "item.processed.entities.entity-names-by-entity-ids": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'entity-names-by-entity-ids.json'),
    // },

    // "item.from-wiki.entities.entity-ids-by-lowercase-entity-names": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'From wiki', 'Entities', 'entity-ids-by-lowercase-entity-names.json'),
    //     wikiPage: 'Module:Item/item ids by item lowercase names.json'
    // },

    // "item.from-wiki.entities.entity-names-by-entity-ids": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Items', 'From wiki', 'Entities', 'entity-names-by-entity-ids.json'),
    //     wikiPage: 'Module:Item/item names by item ids.json'
    // },



    // "research.techs.parsed": {
    //     type: 'dir',
    //     ss14Path: path.join('Resources', 'Prototypes', 'Research'),
    //     ss14PathExcludeGlobs: ['disciplines.yml'],
    //     projectInputPath: path.join('Research', 'Techs'),
    //     projectConvertedPath: path.join('Research', 'Techs'),
    //     projectOutputFilePath: path.join('Research', 'research.techs.parsed.json')
    // },

    // "research.techs.processed": {
    //     type: 'dir',
    //     projectOutputFilePath: path.join('Research', 'research.techs.processed.json'),
    //     wikiPage: 'Module:Research/techs by tech IDs by discipline IDs.json'
    // },

    // "research.disciplines.parsed": {
    //     type: 'file',
    //     ss14Path: path.join('Resources', 'Prototypes', 'Research', 'disciplines.yml'),
    //     projectInputPath: path.join('Research', 'Disciplines', 'disciplines.yml'),
    //     projectConvertedPath: path.join('Research', 'Disciplines', 'disciplines.json'),
    //     projectOutputFilePath: path.join('Research', 'research.disciplines.parsed.json')
    // },

    // "research.disciplines.processed": {
    //     type: 'file',
    //     projectOutputFilePath: path.join('Research', 'research.disciplines.processed.json'),
    //     wikiPage: 'Module:Research/disciplines by discipline IDs.json'
    // }
} satisfies Record<string, string>;