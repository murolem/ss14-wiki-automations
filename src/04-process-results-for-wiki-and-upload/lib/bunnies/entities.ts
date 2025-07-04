import { toOsPath } from '$utils/toOsPath';
import fs, { outputJSON } from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("wiki/preprocess/entities");
const { logInfo, logWarn, logFatal } = logger;
import { z } from 'zod';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync, type JsonReplacer } from '$utils/writeJson';
import path from 'path';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { projectProcessingOutputs, projectStepDirpaths, projectWikiOutputs, type ProjectProcessingOutputsOutput, type Project, type ProjectProcessingOutputName, type ProjectProcessingOutputNameByProject, type ProjectProcessingOutputsProject, type ProjectWikiOutputName, type ProjectWikiOutputNameByProject, type ProjectWikiOutputsByProject, type ProjectWikiOutputsOutput, type ProjectWikiOutputsProject, type Step, type ProjectProcessingOutputsByProject } from '$src/preset';
import { schemaParse } from '$schemas/utils/assertSchema';
import { entityPrototypeSchema } from '$schemas/prototype/prototypes/entity';

export default generateProcessorRunner(
    'entities',
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
    const inputCtxEntitiesJson = getProcessingContext('entities', 'entitiesJson');
    const outputCtxEntityMapOfIdTOName = getWikiContext('entities', 'entity_map_of_id_to_name');
    const outputCtxEntityMapOfLcNameToId = getWikiContext('entities', 'entity_map_of_lc_name_to_id');

    const entities = inputCtxEntitiesJson.loadAndParseData();

    const entitiesSortedBy = {
        id: entities.toSorted((a, b) => a.id.localeCompare(b.id)),
        name: entities.toSorted((a, b) => {
            // put entities without a name at the end
            if (!a.name) {
                return 1;
            } else if (!b.name) {
                return -1;
            }

            return a.name.localeCompare(b.name);
        }),
    }

    /** 
     * Map of entity IDs to their names.
     * Only entities with non-empty names get mapped.
     * Based on entities ordered by ID, so the names of those will come first.
     */
    const entity_map_of_id_to_name: z.infer<typeof wikiOutput.entity_map_of_id_to_name.schema> =
        entitiesSortedByIdFiltered.reduce((accum, entity) => {
            if (entity.name === undefined || entity.name === "") {
                // many abstract entities don't have a name, so skip them safely.
                // though not many concrete entities don't have a name - log them just in case.
                if (entity.abstract !== true) {
                    logInfo(chalk.gray(`mapping entity IDs to names, skipping a non-abstract entity without a name: ID ${chalk.bold(entity.id)}`));
                }

                return accum;
            }

            accum[entity.id] = entity.name;

            return accum;
        }, {} as Record<string, string>);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_id_to_name.filepath),
        entity_map_of_id_to_name,
        entitiesSortedByIdFiltered
            .filter(ent => ent.id in entity_map_of_id_to_name)
            .map(ent => ent.id)
    )

    /** 
     * Map of entity names to their IDs.
     * Only entities with non-empty names get mapped.
     * Based on entities ordered by name, so the names of those will come first.
     */
    const entity_map_of_name_to_id: z.infer<typeof wikiOutput.entity_map_of_lc_name_to_id.schema> =
        entitiesSortedByNameFiltered.reduce((accum, ent) => {
            const nameLc = ent.name!.toLocaleLowerCase();

            if (nameLc in accum) {
                logInfo(chalk.gray(`skipping entity ${chalk.bold(ent.id)} while mapping name → ID: name ${chalk.italic(ent.name)} already mapped to ID ${chalk.bold(accum[nameLc])}`));
                return accum;
            }

            accum[nameLc] = ent.id;

            return accum;
        }, {} as Record<string, string>);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_lc_name_to_id.filepath),
        entity_map_of_name_to_id,
        entitiesSortedByNameFiltered
            .filter(ent => ent.name! in entity_map_of_name_to_id)
            .map(ent => ent.name!),
    )
}

// type AAAAAAAAAAAAAAAAA = keyof typeof projectWikiOutputs;

// function getOutputWriter<TProj extends keyof typeof projectWikiOutputs>(

// ) {
//     return function <
//         TOutputName extends keyof (typeof projectWikiOutputs)[TProj],
//         TOutput extends (typeof projectWikiOutputs)[TProj][TOutputName]
//     >(
//         outputName: TOutputName,
//         data: TOutput['']
//     ) {
//         // expands object types one level deep
//         type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
//         // expands object types recursively
//         type ExpandRecursively<T> = T extends object
//             ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
//             : T;


//         let aaaaaaaa: ProjectWikiOutputsByProject<TProj>[TOutputName];
//         type aaaaaaaaaaaaaaaaaaaaaa = ExpandRecursively<typeof aaaaaaaa>;
//         aaaaaaaa = projectWikiOutputs.entities.entity_map_of_id_to_name;
//     }
// }

/** Constructs an object containing info about a project output from the processing step. */
function getProcessingContext<TProj extends ProjectProcessingOutputsProject>(
    project: TProj,
    outputName: ProjectProcessingOutputNameByProject<TProj>
) {
    return getContext(
        projectProcessingOutputs,
        project,
        'processed',
        // @ts-ignore guh?
        outputName
    );
}

/** Constructs an object containing info about a project output from the wiki step. */
function getWikiContext<TProj extends ProjectWikiOutputsProject>(
    project: TProj,
    outputName: ProjectWikiOutputNameByProject<TProj>
) {
    return getContext(
        projectWikiOutputs,
        project,
        'wiki_upload',
        // @ts-ignore guh?
        outputName
    );
}

type Idx<T, K> = K extends keyof T ? T[K] : never;

/** Constructs an object containing info about a project output from a specified step. */
function getContext<
    TStep extends Extract<Step, "processing" | "wiki">,
    TProject extends (TStep extends "processing"
        ? ProjectProcessingOutputsProject
        : ProjectWikiOutputsProject
    ),
    TOutputName extends (TStep extends "processing"
        ? ProjectProcessingOutputName
        : ProjectWikiOutputName
    ),
    TSchema extends (TStep extends "processing"
        ? Idx<Idx<ProjectProcessingOutputsByProject<TProject>, TOutputName>, 'schema'>
        : Idx<Idx<ProjectWikiOutputsByProject<TProject>, TOutputName>, 'schema'>
    ),
>(
    project: TProject,
    step: TStep,
    outputName: TOutputName
) {
    const outputs = (() => {
        switch (step) {
            case 'processing': return projectProcessingOutputs;
            case 'wiki': return projectWikiOutputs;
            default: {
                logFatal({ msg: `unknown step '${step}'`, throw: true });
                throw ''//type guard
            }
        }
    })();

    const projectOutputs = outputs[project as keyof typeof outputs];
    if (!projectOutputs) {
        logFatal({ msg: "undefined project", throw: true, data: { project, step, outputName } });
        throw ''//type guard
    }

    const output = projectOutputs[outputName as keyof typeof projectOutputs] as (ProjectProcessingOutputsOutput | ProjectWikiOutputsOutput);
    if (!output) {
        logFatal({ msg: "undefined output", throw: true, data: { project, step, outputName } });
        throw ''//type guard
    }

    // ==========

    const absFilepath = path.join(projectStepDirpaths[project][step], output.filepath);
    if (!fs.existsSync(absFilepath)) {
        logFatal({
            msg: `project step filepath does not exist`,
            throw: true,
            data: {
                project,
                step,
                outputName,
                projectFilepath: projectStepDirpaths[project][step],
                absFilepath
            }
        });
    }

    const loadAndParseData = () => schemaParse(output.schema, fs.readJsonSync(absFilepath));
    const writeData = (data: unknown) => ensuredWritePrettyJsonSync(absFilepath, schemaParse(output.schema, data));

    return {
        ...output,
        absFilepath,
        schema: output.schema as TSchema,
        loadAndParseData,
        writeData
    }
}