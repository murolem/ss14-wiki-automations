import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("wiki/preprocess/entities");
const { logDebug, logInfo, logWarn, logFatal } = logger;
import { z } from 'zod';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync, type JsonReplacer } from '$utils/writeJson';
import path from 'path';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { schemaParse } from '$schemas/utils/assertSchema';
import { entityPrototypeSchema } from '$schemas/prototype/prototypes/entity';
import { projectStepDirpaths, processingStepOutputs, wikiStepOutputs, type ProcessingStepOutputProject, type ProcessingStepOutputsByProject, type WikiStepOutputProject, type WikiStepOutputsByProject, type Step, type Project, type ProcessingStepOutputName, type ProcessingStepOutputs, type WikiStepOutput, type ProcessingStepOutput, type WikiStepOutputs } from '$src/preset';

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
    const inputCtxEntitiesJson = getProcessingContext('entities', 'entities_json');
    const outputCtxEntityMapOfIdToName = getWikiContext('entities', 'entity_map_of_id_to_name');
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
     * 
     * Entities without a name or empty name are discarded.
     * 
     * Writes data with the ID ordering defined in {@link entitiesSortedBy}.
     */
    const entityMapOfIdToName = outputCtxEntityMapOfIdToName.writeData(
        entities.reduce<
            z.infer<typeof outputCtxEntityMapOfIdToName['schema']>
        >((accum, ent) => {
            if (ent.name === undefined || ent.name === "") {
                // many abstract entities don't have a name, which is expected, so do not log about those.
                if (!ent.abstract) {
                    logInfo(chalk.gray(`mapping entity IDs to names, skipping a non-abstract entity without a name: ID ${chalk.bold(ent.id)}`));
                }

                return accum;
            }

            accum[ent.id] = ent.name;

            return accum;
        }, {}),
        data => entitiesSortedBy.id
            .map(ent => ent.id)
    );

    /** 
     * Map of entity names in lowercase to their IDs.
     * 
     * Entities without a name or empty name are discarded. 
     * Entities with the same lowercase name are discarded except the first entity,
     * which is determined by the ordering in {@link entitiesSortedBy}.
     * 
     * Writes data with the name ordering defined in {@link entitiesSortedBy}.
     */
    const entityMapOfLcNameToId = outputCtxEntityMapOfLcNameToId.writeData(
        Object.entries(entityMapOfIdToName).reduce<
            z.infer<typeof outputCtxEntityMapOfLcNameToId.schema>
        >((accum, [id, name]) => {
            const nameLc = name.toLocaleLowerCase();

            if (nameLc in accum) {
                logInfo(chalk.gray(`skipping entity ${chalk.bold(id)} while mapping name → ID: name ${chalk.italic(name)} already mapped to ID ${chalk.bold(accum[nameLc])}`));

                return accum;
            }

            accum[nameLc] = id;

            return accum;
        }, {}),
        data => entitiesSortedBy.name
            .filter(ent => ent.name !== undefined)
            .map(ent => ent.name!),
    )
}

/** Contains info about a project output from a specific step, along with some functions. */
type Context<T extends ProcessingStepOutput | WikiStepOutput> = T & {
    absFilepath: string,
    schema: T['schema'],
    /** Loads data from the filepath, parsing it with schema provided to this context. */
    loadAndParseData: () => z.infer<T['schema']>,
    /** Writes data to th filepath. Returns the same data. */
    writeData: (
        data: z.infer<T['schema']>,
        /** 
         * Defines a function that produces a replacer function to use for json.
         * 
         * Why not just use the replacer directly? Well, then the replacer won't be able to reference the data
         * unless it's defined before the writeData call, which is undesirable since it disallows its creation inside the writeData call.
         */
        getReplacer?: (data: z.infer<T['schema']>) => JsonReplacer
    ) => z.infer<T['schema']>
}

/** Constructs an object containing info about a project output from the processing step. */
function getProcessingContext<
    TProj extends ProcessingStepOutputProject,
    TName extends ProcessingStepOutputsByProject<TProj>['name'],
    TOutput extends Extract<ProcessingStepOutputs[number], { project: TProj, name: TName }>
>(
    project: TProj,
    outputName: TName
): Context<TOutput> {
    return getContext(
        project,
        'processed',
        outputName
    );
}

/** Constructs an object containing info about a project output from the wiki step. */
function getWikiContext<
    TProj extends WikiStepOutputProject,
    TName extends WikiStepOutputsByProject<TProj>['name'],
    TOutput extends Extract<WikiStepOutputs[number], { project: TProj, name: TName }>
>(
    project: TProj,
    outputName: TName
): Context<TOutput> {
    return getContext(
        project,
        'wiki_upload',
        outputName
    );
}


/** 
 * Constructs an object containing info about a project output from a specified step. 
 * 
 * Note: This is a non-generic method. Use {@link getProcessingContext} and {@link getWikiContext} in main code.
*/
function getContext<T extends ProcessingStepOutput | WikiStepOutput>(
    project: Project,
    step: Step,
    outputName: string
): Context<T> {
    const outputs = (() => {
        switch (step) {
            case 'processed': return processingStepOutputs;
            case 'wiki_upload': return wikiStepOutputs;
            default: {
                logFatal({ msg: `unsupported step '${step}'`, throw: true });
                throw ''//type guard
            }
        }
    })();

    const projectOutputs = outputs.filter(e => e.project === project);
    if (projectOutputs.length === 0) {
        logFatal({
            msg: `no outputs for project ${chalk.bold(project)} found`,
            throw: true,
            data: { project, step, outputName }
        });
        throw ''//type guard
    }

    const output = projectOutputs.find(e => e.name === outputName);
    if (!output) {
        logFatal({
            msg: `no output with name ${chalk.bold(outputName)} is defined for project ${chalk.bold(project)}`,
            throw: true,
            data: { project, step, outputName }
        });
        throw ''//type guard
    }

    // ==========

    const absFilepath = path.join(projectStepDirpaths[project][step], output.relFilepath);

    // @ts-ignore idk how to fix this shit
    const loadAndParseData: Context<T>['loadAndParseData'] = (): z.infer<T['schema']> => {
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

        logDebug(`loading and parsing data for project ${chalk.bold(project)} step ${chalk.bold(step)} output ${chalk.bold(outputName)} \nfrom: ${absFilepath}`);
        const data = schemaParse(output.schema, fs.readJsonSync(absFilepath));
        logDebug("data loaded!");

        return data;
    }

    // @ts-ignore idk how to fix this shit
    const writeData: Context<T>['writeData'] = (
        data: z.infer<T['schema']>,
        getReplacer?: (data: z.infer<T['schema']>) => JsonReplacer
    ): z.infer<T['schema']> => {
        logInfo(`writing data for project ${chalk.bold(project)} step ${chalk.bold(step)} output ${chalk.bold(outputName)} \nto: ${absFilepath}`);
        ensuredWritePrettyJsonSync(
            absFilepath,
            schemaParse(output.schema, data),
            getReplacer?.(data)
        );
        logInfo("data written!");

        return data;
    }

    // @ts-ignore idk how to fix this shit
    return {
        ...output,
        absFilepath,
        schema: output.schema,
        loadAndParseData,
        writeData
    }
}