import { prototypeArraySchema, type Prototype } from '$schemas/prototype';
import { resolveInheritance } from '$schemas/utils';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { projectProcessingOutputs, projectStepDirpaths } from '$src/preset';
import { readFilesRecursive } from '$utils/readFilesRecursive';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import fs from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("process/processors/prototype");

let prototypes: Prototype[] = [];
let prototypeIds: string[] = [];

let loaded = false;

registerProcessor('prototypes', ({
    dirpath,
    stepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    const { logDebug, logInfo, logFatal } = logger;

    const prototypesDirPath = projectStepDirpaths.prototypes.converted;

    logInfo(`loading prototypes for the first time; from: ${chalk.bold(prototypesDirPath)}`);

    if (!fs.existsSync(prototypesDirPath)) {
        logFatal({
            msg: `failed to load prototypes: path doesn't exist: ${prototypesDirPath}`,
            throw: true
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

            logFatal({
                msg: `failed to load prototypes: failed to parse prototype at: ${absPath}`,
                throw: true,
                data: {
                    parseError: parsedResult.error
                }
            });
            throw ''
        }

        logDebug(`  ^prototypes: ${parsedResult.data.length}`);

        for (const proto of parsedResult.data) {
            if (prototypeIds.includes(proto.id)) {
                logFatal({
                    msg: `failed to load prototypes: encountered a prototype '${proto.id}' with a duplicate ID. Found at: ${absPath}`,
                    throw: true
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

    logInfo(chalk.bold(`resolving inheritance`));

    const prototypesResolved = prototypes
        .map(proto => resolveInheritance(proto, prototypes));

    writeJsonSync(
        'output',
        projectProcessingOutputs.prototypes.prototypesJson,
        prototypesResolved
    );

    loaded = true;
});

export function getPrototypes() {
    if (!loaded) {
        logger.logFatal({
            msg: "failed to get prototypes: prototypes are not loaded. Run the processor first.",
            throw: true
        })
    }

    return prototypes;
}