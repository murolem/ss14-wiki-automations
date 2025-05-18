import { projectDirpaths, projectStepDirpaths, type Project } from '$src/preset';
import { Logger } from '$logger';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsEmpty';
const logger = new Logger("process/registerProcessor");
const { logInfo, logFatal } = logger;
import fs from 'fs-extra';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import path from 'path';

export type ProcessorArgs = {
    dirpath: string,
    stepDirpaths: typeof projectStepDirpaths[Project],
    outputDirpath: string,
    tempDirpath: string,
    logger: Logger,
    writeJsonSync: ReturnType<typeof getWriteJsonSyncInstance>,
    assertPathExists: typeof assertPathExists;
}
export type Processor = (args: ProcessorArgs) => void;
const processors: Partial<Record<Project, Processor>> = {};

/** Loads and registers all processors. */
export async function loadProcessors(): Promise<void> {
    logInfo("loading processors");

    const processorsDirpath = toOsPath(`${import.meta.dirname}/processors`);
    if (!fs.existsSync(processorsDirpath)) {
        logFatal({
            msg: `failed to load processors: processors directory does not exist: ${processorsDirpath}`,
            throw: true
        });
        throw ''//guard
    }

    const scripts = fs.readdirSync(processorsDirpath)
        .filter(file => fs.statSync(path.join(processorsDirpath, file)).isFile()
            && path.parse(file).ext === ".ts");

    if (scripts.length === 0) {
        logFatal({
            msg: `failed to load processors: no processors found to load`,
            throw: true,
            data: {
                processorsDirpath: processorsDirpath
            }
        });
        throw ''//guard
    }

    logInfo(`founds ${chalk.bold(scripts.length)} processors to loads ;3`);

    for (const script of scripts) {
        logInfo(`loading processor in ${chalk.bold(script)}`);

        const fullPath = toOsPath(`file://${processorsDirpath}/${script}`);
        await import(fullPath);
    }

    logInfo("processor load finished! OwO")
}

/** Registers a new project processor. */
export function registerProcessor(project: Project, processor: Processor): void {
    if (processors[project]) {
        logFatal({
            msg: `failed to register a processor: a processor for project '${project}' is already registered`,
            throw: true
        });
        throw ''//guard
    }

    processors[project] = processor;
}

/** 
 * Returns a registered processor.
 * @throws {Error} if no processor is registered for that project.
 */
export function getProcessor(project: Project): Processor {
    const processor = processors[project];
    if (!processor) {
        logFatal({
            msg: `failed to get a processor: no processor is registered for project '${project}'`,
            throw: true
        });
        throw ''//guard
    }

    return processor;
}

/**
 * Runs processor for a given project.
* @throws {Error} if no processor is registered for that project.
 */
export function runProcessor(project: Project) {
    const processor = getProcessor(project);

    const processorLogger = new Logger(`process/processor`);

    const projectDirpath = projectDirpaths[project];

    const outputDirpath = projectStepDirpaths[project].processed;
    ensureDirectoryExistsAndEmpty(outputDirpath);
    const tempDirpath = projectStepDirpaths[project].processed_temp;
    ensureDirectoryExistsAndEmpty(tempDirpath);

    const writeJsonSync = getWriteJsonSyncInstance(outputDirpath, tempDirpath, processorLogger);

    processorLogger.logInfo(`starting project ${chalk.bold(project)}; path: ${chalk.gray(projectDirpaths[project])})`);
    processor({
        dirpath: projectDirpath,
        stepDirpaths: projectStepDirpaths[project],
        outputDirpath: outputDirpath,
        tempDirpath: tempDirpath,
        logger: processorLogger,
        writeJsonSync: writeJsonSync,
        assertPathExists: assertPathExists
    });
    processorLogger.logInfo(`✅ project ${chalk.bold(project)} finished`);
}

function getWriteJsonSyncInstance(outputDirpath: string, tempDirpath: string, logger: Logger) {
    return (target: 'output' | 'temp', relFilepath: string, data: unknown) => {
        const baseDir = target === 'output'
            ? outputDirpath
            : tempDirpath;

        const combinedPath = toOsPath(`${baseDir}/${relFilepath}`);

        if (target === 'output') {
            logger.logInfo(`writing output JSON ${chalk.bold(relFilepath)}; path: ${chalk.gray(combinedPath)}`);
        } else {
            logger.logInfo(chalk.gray(`writing temp JSON ${chalk.bold(relFilepath)}; path: ${chalk.gray(combinedPath)}`));
        }
        writeJsonSync(combinedPath, data);
    }
}

/** 
 * Writes data as a JSON sequence.
 * 
 * Automatically applies 4 spaces.
 */
function writeJsonSync(filepath: string, data: unknown): void {
    fs.writeJsonSync(filepath, data, { spaces: 4 });
}

/** 
 * Checks whether given path exists.
 * 
 * @throws {Error} If given path doesn't exists. 
 * If {@link errorMsg} is provided, used it for the error message.
  */
function assertPathExists(pathStr: string, errorMsg?: string): void {
    if (!fs.existsSync(pathStr)) {
        logFatal({
            msg: errorMsg ?? `path exist assertion failed: path doesn't exist: ${pathStr}`,
            throw: true,
            data: {
                path: pathStr
            }
        });
    }
}