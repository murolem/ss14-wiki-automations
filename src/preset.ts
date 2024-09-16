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

    // reagents: {
    //     type: 'dir',
    //     ss14Path: path.join('Resources', 'Prototypes', 'Reagents'),
    //     projectInputPath: path.join('Reagents'),
    //     projectConvertedPath: path.join('Reagents'),
    //     projectOutputFilePath: path.join('Reagents', 'reagents.json')
    // },

    // reactions: {
    //     type: 'dir',
    //     ss14Path: path.join('Resources', 'Prototypes', 'Recipes', 'Reactions'),
    //     projectInputPath: path.join('Recipes', 'Reactions'),
    //     projectConvertedPath: path.join('Recipes', 'Reactions'),
    //     projectOutputFilePath: path.join('Recipes', 'reactions.json')
    // },

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
    // items

    "item.source.entities.foldable": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'foldable.yml'),
        projectInputPath: path.join('Items', 'Entities', 'foldable.yml'),
        projectConvertedPath: path.join('Items', 'Entities', 'foldable.json'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'foldable.json'),
    },

    "item.source.entities.clothing": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Clothing'),
        projectInputPath: path.join('Items', 'Entities', 'Clothing'),
        projectConvertedPath: path.join('Items', 'Entities', 'Clothing'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'clothing.json'),
    },

    "item.source.entities.objects": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Objects'),
        projectInputPath: path.join('Items', 'Entities', 'Objects'),
        projectConvertedPath: path.join('Items', 'Entities', 'Objects'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'objects.json'),
    },

    "item.source.entities.structures": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Structures'),
        projectInputPath: path.join('Items', 'Entities', 'Structures'),
        projectConvertedPath: path.join('Items', 'Entities', 'Structures'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'structures.json'),
    },

    "item.source.entities.tiles": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Tiles'),
        projectInputPath: path.join('Items', 'Entities', 'Tiles'),
        projectConvertedPath: path.join('Items', 'Entities', 'Tiles'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'tiles.json'),
    },

    "item.source.entities.mobs": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Mobs'),
        projectInputPath: path.join('Items', 'Entities', 'Mobs'),
        projectConvertedPath: path.join('Items', 'Entities', 'Mobs'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'mobs.json'),
    },

    "item.source.entities.body.organs": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Body', 'Organs'),
        projectInputPath: path.join('Items', 'Entities', 'Body', 'Organs'),
        projectConvertedPath: path.join('Items', 'Entities', 'Body', 'Organs'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'body-organs.json'),
    },

    "item.source.entities.debugging": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Debugging'),
        projectInputPath: path.join('Items', 'Entities', 'Entities', 'Debugging'),
        projectConvertedPath: path.join('Items', 'Entities', 'Entities', 'Debugging'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'debugging.json'),
    },

    "item.source.entities.body.parts": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Body', 'Parts'),
        projectInputPath: path.join('Items', 'Entities', 'Body', 'Parts'),
        projectConvertedPath: path.join('Items', 'Entities', 'Body', 'Parts'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'body-parts.json'),
    },

    "item.source.entities.store.presets": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'Store', 'presets.yml'),
        projectInputPath: path.join('Items', 'Entities', 'Store', 'presets.yml'),
        projectConvertedPath: path.join('Items', 'Entities', 'Mobs', 'presets.json'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'store-presents.json'),
    },

    // entities that are containers
    // and have something in em'!
    "item.source.entities.catalog.fills": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Catalog', 'Fills'),
        projectInputPath: path.join('Items', 'Entities', 'Catalog', 'Fills'),
        projectConvertedPath: path.join('Items', 'Entities', 'Catalog', 'Fills'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'catalog-fills.json'),
    },

    // something-something only used for inheritance
    "item.source.entities.inventory-templates.inventorybase": {
        type: 'file',
        ss14Path: path.join('Resources', 'Prototypes', 'InventoryTemplates', 'inventorybase.yml'),
        projectInputPath: path.join('Items', 'Entities', 'InventoryTemplates', 'inventorybase.yml'),
        projectConvertedPath: path.join('Items', 'Entities', 'InventoryTemplates', 'inventorybase.json'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'inventory_templates-inventorybase.json'),
    },

    // another thing only used for inheritance
    "item.source.entities.markers": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Entities', 'Markers'),
        projectInputPath: path.join('Items', 'Entities', 'Markers'),
        projectConvertedPath: path.join('Items', 'Entities', 'Markers'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'Per data path', 'markers.json'),
    },

    "item.source.reagents": {
        type: 'dir',
        ss14Path: path.join('Resources', 'Prototypes', 'Reagents'),
        ss14PathExcludeGlobs: ['Materials'],
        projectInputPath: path.join('Items', 'Reagents'),
        projectConvertedPath: path.join('Items', 'Reagents'),
        projectOutputFilePath: path.join('Items', 'Processed', 'Reagents', 'reagents.json'),
    },

    // all entities parsed by a validator
    "item.processed.entities.all-entities-raw-array": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'Before processing', 'Entities', 'all-entities-array.json'),
    },

    // all entities fully processed
    "item.processed.entities.entities-array": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'all-entities-array.json'),
    },

    "item.processed.entities.entity-ids-by-lowercase-entity-names": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'entity-ids-by-lowercase-entity-names.json'),
    },

    "item.processed.entities.entity-names-by-entity-ids": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'Processed', 'Entities', 'entity-names-by-entity-ids.json'),
    },

    "item.from-wiki.entities.entity-ids-by-lowercase-entity-names": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'From wiki', 'Entities', 'entity-ids-by-lowercase-entity-names.json'),
        wikiPage: 'Module:Item/item ids by item lowercase names.json'
    },

    "item.from-wiki.entities.entity-names-by-entity-ids": {
        type: 'file',
        projectOutputFilePath: path.join('Items', 'From wiki', 'Entities', 'entity-names-by-entity-ids.json'),
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