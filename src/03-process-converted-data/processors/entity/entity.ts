import { getProcessingOutput } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { entityPrototypeSchema, type EntityPrototype } from '$schemas/prototype/prototypes/entity';
import { Logger } from '$logger';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getPrototypes } from '$process/processors/prototype';
const logger = new Logger("process/processors/entities");
const { logInfo, logFatalAndThrow } = logger;

let loaded = false;
let entities: EntityPrototype[] = [];

export default generateProcessorRunner(
    'entity',
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
    const { logInfo, logFatalAndThrow } = logger;

    logInfo("searching for protos");

    entities = getPrototypes()
        .filter(proto => proto.type === 'entity');

    writeJsonSync('temp', 'entities_raw.json', entities);

    logInfo("parsing protos");

    entities = entityPrototypeSchema.array()
        .parse(entities);

    writeJsonSync(
        'output',
        getProcessingOutput('entity', 'entities_json').relFilepath,
        entities
    );

    loaded = true;
};

/**
 * Checks whether entities have been loaded.
 * 
 * @throws {Error} If entities have not been loaded yet.
 */
export function assertEntitiesLoaded() {
    if (!loaded) {
        logFatalAndThrow({
            msg: `entities loaded assertion failed: entities not loaded`,
        });
    }
}

export function getEntities() {
    assertEntitiesLoaded();

    return entities;
}