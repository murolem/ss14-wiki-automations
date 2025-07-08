import { Logger } from '$logger';
import { schemaParse } from '$schemas/utils/assertSchema';
import { type ProcessingStepOutput, type WikiStepOutput, type ProcessingStepOutputProject, type ProcessingStepOutputsByProject, type ProcessingStepOutputs, type WikiStepOutputProject, type WikiStepOutputsByProject, type WikiStepOutputs, type Project, type Step, processingStepOutputs, wikiStepOutputs, projectStepDirpaths } from '$src/preset';
import { type JsonComparator, type JsonReplacer, ensuredWritePrettyJsonSync } from '$utils/writeJson';
import chalk from 'chalk';
import path from 'path';
import type z from 'zod';
const logger = new Logger("wiki/preprocess/context");
const { logDebug, logInfo, logWarn, logFatal } = logger;
import fs from 'fs-extra';

/** Contains info about a project output from a specific step, along with some functions. */
export type Context<T extends ProcessingStepOutput | WikiStepOutput> = T & {
    absFilepath: string,
    schema: T['schema'],
    /** Loads data from the filepath, parsing it with schema provided to this context. */
    loadAndParseData: () => z.infer<T['schema']>,
    /** Writes data to th filepath. Returns the same data. */
    writeData: (
        data: z.infer<T['schema']>,
        compFn?: JsonComparator
    ) => z.infer<T['schema']>
}

/** Constructs an object containing info about a project output from the processing step. */
export function getProcessingContext<
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
export function getWikiContext<
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
export function getContext<T extends ProcessingStepOutput | WikiStepOutput>(
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
        compFn?: JsonComparator
    ): z.infer<T['schema']> => {
        logInfo(`writing data for project ${chalk.bold(project)} step ${chalk.bold(step)} output ${chalk.bold(outputName)} \nto: ${absFilepath}`);
        ensuredWritePrettyJsonSync(
            absFilepath,
            schemaParse(output.schema, data),
            {
                comparator: compFn
            }
        );
        logInfo(chalk.gray("data written!"));

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