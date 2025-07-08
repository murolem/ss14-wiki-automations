import { projectDirpaths, projectStepDirpaths, type Project, type Step } from '$src/preset';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import fs from 'fs-extra';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import path from 'path';
import { ensuredWritePrettyJsonSync, type JsonReplacer } from '$utils/writeJson';
import { assertPathExists } from '$assert/pathExists';
const logger = new Logger("processor");
const { logInfo, logFatal } = logger;

/**
 * Contains a definition for a project processor and a processor runner generator function.
 * 
 * Project processor is a function that processes a data from one step and outputs it as input to another step.
 * Each processor is given a bunch of related variables like calculated paths to ease whatever it is doing.
 * 
 * Processor runner is a self-contained wrapper around a processor that runs it.
 */

/** {@link Processor} arguments. */
export type ProcessorArgs = {
    project: Project,
    projectDirpath: string,
    step: Step,
    tempStep: Step,
    outputDirpath: string,
    tempDirpath: string,
    stepDirpaths: typeof projectStepDirpaths[Project],
    logger: Logger,
    writeJsonSync: ReturnType<typeof getWriteJsonSyncInstance>
}

/** Project processor function. */
export type Processor = (args: ProcessorArgs) => void;

/** Self-contained function that runs a processor. */
export type ProcessorRunner = () => void;

/**
 * Creates a processor runner for a given project.
 * @param project Project.
 * @param step Main step.
 * @param tempStep Step for holding temporary data.
 * @param processor Project data processor.
 */
export function generateProcessorRunner(
    project: Project,
    step: Step,
    tempStep: Step,
    processor: Processor
): ProcessorRunner {
    logger.logDebug(`generating processor for project ${chalk.bold(project)}: ${chalk.bold(step)}`);

    const processorLogger = new Logger(`processor/${project}`);

    const projectDirpath = projectDirpaths[project];
    const outputDirpath = projectStepDirpaths[project][step];
    const tempDirpath = projectStepDirpaths[project][tempStep];

    ensureDirectoryExistsAndEmpty(outputDirpath);
    ensureDirectoryExistsAndEmpty(tempDirpath);

    const writeJsonSync = getWriteJsonSyncInstance(outputDirpath, tempDirpath, processorLogger);

    return () => {
        logger.logInfo(chalk.underline(`running processor for project ${chalk.bold(project)} step ${chalk.bold(step)}`));

        processor({
            project: project,
            projectDirpath: projectDirpath,
            step: step,
            tempStep: tempStep,
            outputDirpath: outputDirpath,
            tempDirpath: tempDirpath,
            stepDirpaths: projectStepDirpaths[project],
            logger: processorLogger,
            writeJsonSync: writeJsonSync
        });

        logger.logDebug(`✅ finished processor for project ${chalk.bold(project)}: ${chalk.bold(step)}`);
    }
}

/**
 * Generates a JSON-writing function specific for a given project, 
 * represented by output/temp directory paths and a custom logger instance.
 * 
 * Returned function allows to pick the temp/output directory path with a separate argument.
 * The written data is automatically formatted to have 4 spaces.
 * Every write is accommodated with a log message.
 * 
 * @param outputDirpath Directory path for writing useful data.
 * @param tempDirpath Directory path for writing intermediary data.
 * @param logger Logger instance to use with this writer.
 * @returns A json writing function.
 */
function getWriteJsonSyncInstance(outputDirpath: string, tempDirpath: string, logger: Logger) {
    return (target: 'output' | 'temp', relFilepath: string, data: unknown, replacer?: JsonReplacer) => {
        const baseDir = target === 'output'
            ? outputDirpath
            : tempDirpath;

        const combinedPath = path.join(baseDir, relFilepath);

        if (target === 'output') {
            logger.logInfo(`writing output JSON ${chalk.bold(relFilepath)}; \npath: ${chalk.gray(combinedPath)}`);
        } else {
            logger.logInfo(chalk.gray(`writing temp JSON ${chalk.bold(relFilepath)}; \npath: ${chalk.gray(combinedPath)}`));
        }
        ensuredWritePrettyJsonSync(combinedPath, data, { replacer });
    }
}