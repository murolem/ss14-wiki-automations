import { getProcessingOutput, projectStepDirpaths } from '$src/preset';
import { readFilesRecursive } from '$utils/readFilesRecursive';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import fs from 'fs-extra';
import { Logger } from '$logger';
import { prototypeArraySchema, type ProtoId, type Prototype } from '$schemas/prototype/base';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { createProtoPool, resolveInheritance } from '$process/processors/prototype/resolveInheritance';
const logger = new Logger("process/processors/prototype");
const { logFatalAndThrow } = logger;

let loaded = false;
let prototypes: Prototype[] = [];
let prototypeIds: string[] = [];

export default generateProcessorRunner(
    'prototype',
    'processed',
    'processed_temp',
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
    const { logDebug, logInfo, logFatalAndThrow } = logger;

    const prototypesDirPath = projectStepDirpaths.prototype.converted;

    logInfo("loading prototypes");
    logDebug("from: " + prototypesDirPath);

    if (!fs.existsSync(prototypesDirPath)) {
        logFatalAndThrow({
            msg: `failed to load prototypes: path doesn't exist: ${prototypesDirPath}`,
        });
    }

    for (const relPath of readFilesRecursive(prototypesDirPath)) {
        logDebug(`  found ${relPath}`);

        const absPath = toOsPath(`${prototypesDirPath}/${relPath}`);

        const parsedResult = prototypeArraySchema.safeParse(fs.readJsonSync(absPath));
        if (!parsedResult.success) {
            const issuesLen = parsedResult.error.issues.length;
            const firstIssue = parsedResult.error.issues[0];

            // if (issuesLen === 1
            //     && firstIssue.code === 'invalid_type'
            //     && firstIssue.expected === 'array'
            //     && firstIssue.received === 'null'
            // ) {
            //     // file is empty, skip
            //     logDebug(`  ^file is empty, skipping`);
            //     continue;
            // }

            logFatalAndThrow({
                msg: `failed to load prototypes: failed to parse prototype at: ${absPath}`,
                data: {
                    parseError: parsedResult.error
                }
            });
            throw ''
        }

        logDebug(`  ^prototypes: ${parsedResult.data.length}`);

        for (const proto of parsedResult.data) {
            if (prototypeIds.includes(proto.id)) {
                logFatalAndThrow({
                    msg: `failed to load prototypes: encountered a prototype '${proto.id}' with a duplicate ID. Found at: ${absPath}`,
                });
            }

            prototypes.push(proto);
        }
    }

    logInfo(`prototypes loaded: ${chalk.bold(prototypes.length)}`);

    writeJsonSync(
        'temp',
        "prototypes_raw.json",
        prototypes
    );

    logDebug(`resolving inheritance`);

    const protoPool = createProtoPool(prototypes);
    const prototypesResolved = prototypes
        .map(proto => resolveInheritance(proto, protoPool));
    prototypes = prototypesResolved;

    writeJsonSync(
        'output',
        getProcessingOutput('prototype', 'prototypes_json').relFilepath,
        prototypesResolved
    );

    loaded = true;
}

/**
 * Checks whether prototypes have been loaded.
 * 
 * @throws {Error} If prototypes have not been loaded yet.
 */
export function assertPrototypesLoaded() {
    if (!loaded) {
        logFatalAndThrow({
            msg: `prototypes loaded assertion failed: prototypes not loaded`,
        });
    }
}

export function getPrototypes() {
    assertPrototypesLoaded();

    return prototypes;
}