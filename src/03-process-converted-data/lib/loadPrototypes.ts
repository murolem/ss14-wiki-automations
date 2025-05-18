import { type Prototype, prototypeArraySchema } from '$schemas/prototype';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
import { readFilesRecursive } from '$utils/readFilesRecursive';
const logger = new Logger("loadPrototypes");
const { logDebug, logInfo, logFatal } = logger;
import path from 'path';
import { projectProcessingOutputs, projectStepDirpaths } from '$src/preset';
import chalk from 'chalk';

let prototypes: Prototype[] = [];
let prototypeIds: string[] = [];

let loaded = false;

/** 
 * Loads and returns all prototypes.
 * 
 * Once loaded, subsequent calls will return the same prototype array.
 */
export function loadPrototypes(): Prototype[] {
    if (loaded) {
        return prototypes;
    }

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

    logDebug('writing to disk');

    const savePath = path.join(
        projectStepDirpaths.prototypes.processed,
        projectProcessingOutputs.prototypes.prototypesJson
    );
    fs.ensureDirSync(path.parse(savePath).dir);
    fs.writeJsonSync(
        savePath,
        prototypes,
        { spaces: 4 }
    );

    logDebug('write complete');

    loaded = true;

    return prototypes;
}