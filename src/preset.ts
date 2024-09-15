import path from 'path';

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
export const projectRelPaths = {
    // NOTE: this is also hardcoded into npm commands
    ss14Repo: path.join('temp', '00-ss14-repo'),

    /** Any data that's imported from the SS14 installation. */
    inputData: path.join('temp', '01-input-data'),

    /** Input data converted to parsable formats. */
    convertedData: path.join('temp', '02-converted-data'),

    /** 
     * Input data that was processed, producing a valuable output.
     */
    outputData: path.join('temp', '03-parsed-data'),
} satisfies Record<string, string>

/** Type for a `dataPaths` entry. */
export type DataPath = {
    /** 
     * Type of path. 
     * 
     * `dir` for a directory, `file` for a file.
     */
    type: 'dir' | 'file'

    /** Path to a file/directory (depending on the `type`) to import, relative to the SS14 installation directory. */
    ss14Path?: string,

    /** 
     * A list of globs for paths to exclude from importing.
     * 
     * Works only when `type` = `dir`, otherwise gets ignored.
     */
    ss14PathExcludeGlobs?: string[],

    /** Path to a file/directory (depending on the `type`) to where to import the data.
     *  It must be inside the projects' input data folder. */
    projectInputPath?: string,

    /** Path to a file/directory (depending on the `type`) to where to import data will be converted to. 
     * It must be inside the projects' converted data folder. */
    projectConvertedPath?: string,

    /** 
     * Path to a **file** that will contain the output data. 
     * It must be inside the projects' output data folder.
     * 
     * One data path entry can only produce a single output file.
     * */
    projectOutputFilePath?: string,

    /** A wiki url to upload a file to. */
    wikiPage?: string
}

/** 
 * Contains various paths for files and dirs that are imported to this project, parsed and converted into various format,
 * producing valuable data.
 */
export const dataPaths = {
    // used as a noop
    "noop": {
        type: 'file',
        projectInputPath: 'noop',
        projectConvertedPath: 'noop'
    },

    locale: {
        type: 'dir',
        ss14Path: path.join('Resources', 'Locale'),
        projectInputPath: path.join('Locale')
    },

    reagents: {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Reagents'),
        projectInputPath: path.join('Reagents'),
        projectConvertedPath: path.join('Reagents'),
        projectOutputFilePath: path.join('Reagents', 'reagents.json')
    },

    reactions: {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Recipes', 'Reactions'),
        projectInputPath: path.join('Recipes', 'Reactions'),
        projectConvertedPath: path.join('Recipes', 'Reactions'),
        projectOutputFilePath: path.join('Recipes', 'reactions.json')
    },

    // ================

    // lathe recipes
    "recipes.lathes": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Recipes', 'Lathes'),
        // recipe categories
        ss14PathExcludeGlobs: ['categories.yml'],
        projectInputPath: path.join('Recipes', 'Lathes', 'Recipes by lathe'),
        projectConvertedPath: path.join('Recipes', 'Lathes', 'Recipes by lathe'),
        projectOutputFilePath: path.join('Recipes', 'Lathes', 'lathes.json'),
    },

    // lathe recipe categories
    "recipes.lathes.categories": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Recipes', 'Lathes', 'categories.yml'),
        projectInputPath: path.join('Recipes', 'Lathes', 'categories.yml'),
        projectConvertedPath: path.join('Recipes', 'Lathes', 'categories.json'),
        projectOutputFilePath: path.join('Recipes', 'Lathes', 'categories.json'),
    },

    /** Lathes definition, that contains a list of recipes that can produce, including: by default, when researched, emagged. */
    "recipes.lathes.machines": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Structures', 'Machines', 'lathe.yml'),
        projectInputPath: path.join('Recipes', 'Lathes', 'machines.yml'),
        projectConvertedPath: path.join('Recipes', 'Lathes', 'machines.json'),
        projectOutputFilePath: path.join('Recipes', 'Lathes', 'machines.json')
    },

    // all recipes
    "recipes.recipes by recipe IDs": {
        type: 'file',
        projectOutputFilePath: path.join('Recipes', 'recipes by recipe IDs.json'),
        wikiPage: 'Module:Item recipe/recipes by recipe IDs.json'
    },

    // all recipes
    "recipes.recipe IDs by product IDs": {
        type: 'file',
        projectOutputFilePath: path.join('Recipes', 'recipe IDs by product IDs.json'),
        wikiPage: 'Module:Item recipe/recipe IDs by product IDs.json'
    },

    // all recipes
    "recipes.recipe IDs by method and availability": {
        type: 'file',
        projectOutputFilePath: path.join('Recipes', 'recipe IDs by method and availability.json'),
        wikiPage: 'Module:Item recipe/recipe IDs by method and availability.json'
    },


    // ================

    "entities.source.foldable": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'foldable.yml'),
        projectInputPath: path.join('Entities', 'foldable.yml'),
        projectConvertedPath: path.join('Entities', 'foldable.json'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'foldable.json'),
    },

    "entities.source.clothing": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Clothing'),
        projectInputPath: path.join('Entities', 'Clothing'),
        projectConvertedPath: path.join('Entities', 'Clothing'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'clothing.json'),
    },

    "entities.source.objects": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Objects'),
        projectInputPath: path.join('Entities', 'Objects'),
        projectConvertedPath: path.join('Entities', 'Objects'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'objects.json'),
    },

    "entities.source.structures": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Structures'),
        projectInputPath: path.join('Entities', 'Structures'),
        projectConvertedPath: path.join('Entities', 'Structures'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'structures.json'),
    },

    "entities.source.tiles": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Tiles'),
        projectInputPath: path.join('Entities', 'Tiles'),
        projectConvertedPath: path.join('Entities', 'Tiles'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'tiles.json'),
    },

    "entities.source.mobs": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Mobs'),
        projectInputPath: path.join('Entities', 'Mobs'),
        projectConvertedPath: path.join('Entities', 'Mobs'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'mobs.json'),
    },

    "entities.source.body.organs": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Body', 'Organs'),
        projectInputPath: path.join('Entities', 'Body', 'Organs'),
        projectConvertedPath: path.join('Entities', 'Body', 'Organs'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'body-organs.json'),
    },

    "entities.source.debugging": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Debugging'),
        projectInputPath: path.join('Entities', 'Entities', 'Debugging'),
        projectConvertedPath: path.join('Entities', 'Entities', 'Debugging'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'debugging.json'),
    },

    "entities.source.body.parts": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Body', 'Parts'),
        projectInputPath: path.join('Entities', 'Body', 'Parts'),
        projectConvertedPath: path.join('Entities', 'Body', 'Parts'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'body-parts.json'),
    },

    "entities.source.store.presets": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Store', 'presets.yml'),
        projectInputPath: path.join('Entities', 'Store', 'presets.yml'),
        projectConvertedPath: path.join('Entities', 'Mobs', 'presets.json'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'store-presents.json'),
    },

    // entities that are containers
    // and have something in em'!
    "entities.source.catalog.fills": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Catalog', 'Fills'),
        projectInputPath: path.join('Entities', 'Catalog', 'Fills'),
        projectConvertedPath: path.join('Entities', 'Catalog', 'Fills'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'catalog-fills.json'),
    },

    // something-something only used for inheritance
    "entities.source.inventory-templates.inventorybase": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'InventoryTemplates', 'inventorybase.yml'),
        projectInputPath: path.join('Entities', 'InventoryTemplates', 'inventorybase.yml'),
        projectConvertedPath: path.join('Entities', 'InventoryTemplates', 'inventorybase.json'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'inventory_templates-inventorybase.json'),
    },

    // another thing only used for inheritance
    "entities.source.markers": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Markers'),
        projectInputPath: path.join('Entities', 'Markers'),
        projectConvertedPath: path.join('Entities', 'Markers'),
        projectOutputFilePath: path.join('Entities', 'per-data-path', 'markers.json'),
    },

    "entities.before-processing.all-entities-array": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'before-processing.all-entities-array.json'),
    },

    "entities.processed.all-entities-array": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'processed.all-entities-array.json'),
    },

    "entities.processed.entity-ids-by-lowercase-entity-names": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'processed.entity-ids-by-lowercase-entity-names.json'),
    },

    "entities.processed.entity-names-by-entity-ids": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'processed.entity-names-by-entity-ids.json'),
    },

    "entities.wiki.entity-ids-by-lowercase-entity-names": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'from-wiki.entity-ids-by-lowercase-entity-names.json'),
        wikiPage: 'Module:Item/item ids by item lowercase names.json'
    },

    "entities.wiki.entity-names-by-entity-ids": {
        type: 'file',
        projectOutputFilePath: path.join('Entities', 'from-wiki.entity-names-by-entity-ids.json'),
        wikiPage: 'Module:Item/item names by item ids.json'
    },



    "research.techs.parsed": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Research'),
        ss14PathExcludeGlobs: ['disciplines.yml'],
        projectInputPath: path.join('Research', 'Techs'),
        projectConvertedPath: path.join('Research', 'Techs'),
        projectOutputFilePath: path.join('Research', 'research.techs.parsed.json')
    },

    "research.techs.processed": {
        type: 'dir',
        projectOutputFilePath: path.join('Research', 'research.techs.processed.json'),
        wikiPage: 'Module:Research/techs by tech IDs by discipline IDs.json'
    },

    "research.disciplines.parsed": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Research', 'disciplines.yml'),
        projectInputPath: path.join('Research', 'Disciplines', 'disciplines.yml'),
        projectConvertedPath: path.join('Research', 'Disciplines', 'disciplines.json'),
        projectOutputFilePath: path.join('Research', 'research.disciplines.parsed.json')
    },

    "research.disciplines.processed": {
        type: 'file',
        projectOutputFilePath: path.join('Research', 'research.disciplines.processed.json'),
        wikiPage: 'Module:Research/disciplines by discipline IDs.json'
    }
} satisfies Record<string, DataPath>;