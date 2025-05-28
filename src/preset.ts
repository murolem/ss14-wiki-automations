import { prototypeSchema } from '$schemas/prototype/base';
import { cargoProductProcessedProtoSchema } from '$schemas/prototype/prototypes/cargoProduct';
import { entityPrototypeSchema, entityWikiMapOfIdToName, entityWikiMapOfNameToId } from '$schemas/prototype/prototypes/entity';
import { toOsPath } from '$utils/toOsPath';
import path from 'path';
import { z, type ZodTypeAny } from 'zod';
import dotenv from 'dotenv';
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

// ==========

const cwd = process.cwd();
const tempDirPath = path.join(cwd, 'temp');

export type Project = keyof typeof projectDirnames;
/** Directory names of "projects" — logical blocks for grouping together similar resulting outputs. */
export const projectDirnames = {
    ss14_repo: '_ss14-repo',
    diff: '_diff',
    locale: 'locale',
    prototypes: 'prototypes',
    entities: 'entities',
    items: 'items',
    structures: 'structures',
    item_recipes: 'item-recipes',
    construction_recipes: 'construction-recipes',
    reagents: 'reagents',
    cargo_orders: 'cargo-orders'
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
export type ProcessingStepOutputEntry = {
    filepath: string,
    schema: ZodTypeAny
};

/** Narrowed key type for {@link projectProcessingOutputs}. */
export type ProjectProcessingOutputsKey = {
    [Key in Project]: Key extends keyof typeof projectProcessingOutputs ? Key : never
}[Project];

/** 
 * A mapping for each project to their useful outputs. 
 * This one is for the processing step.  
 * 
 * Output is a filepath relative to the output substep directory.
 */
export const projectProcessingOutputs = {
    prototypes: {
        prototypesJson: {
            filepath: "prototypes.json",
            schema: prototypeSchema.array()
        }
    },
    entities: {
        entitiesJson: {
            filepath: "entities.json",
            schema: entityPrototypeSchema.array()
        }
    },
    cargo_orders: {
        ordersJson: {
            filepath: "orders.json",
            schema: cargoProductProcessedProtoSchema.array()
        }
    }
} satisfies Partial<Record<Project, Record<string, ProcessingStepOutputEntry>>>;

/** Describes a single output from a wiki step. */
export type WikiStepOutputEntry = {
    /** File path from the output substep directory. */
    filepath: string,

    /** 
     * Url to upload the file to.
     * Relative to the wiki endpoint.
    */
    url: string,

    schema: ZodTypeAny
}
/** 
 * A mapping for each project to their useful outputs. 
 * This one is for the wiki step.  
 */
export const projectWikiOutputs = {
    entities: {
        entity_map_of_id_to_name: {
            filepath: "entity_map_of_id_to_name.json",
            url: "Module:Item/data/auto/entity_map_of_id_to_name.json",
            schema: entityWikiMapOfIdToName
        },
        entity_map_of_name_to_id: {
            filepath: "entity_map_of_name_to_id.json",
            url: "Module:Item/data/auto/entity_map_of_name_to_id.json",
            schema: entityWikiMapOfNameToId
        }
    }
} satisfies Partial<Record<Project, Record<string, WikiStepOutputEntry>>>;

