import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { entityPrototypeSchema, type EntityPrototype } from '$schemas/prototype/prototypes/entity';
import { Logger } from '$logger';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getPrototypes } from '$process/processors/prototypes';
const logger = new Logger("process/processors/entities");
const { logInfo, logFatal } = logger;

let loaded = false;
let entities: EntityPrototype[] = [];

export default generateProcessorRunner(
    'entities',
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
    const { logInfo, logFatal } = logger;

    logInfo("searching for protos");

    let entities = getPrototypes()
        .filter(proto => proto.type === 'entity');

    writeJsonSync('temp', 'entities_raw.json', entities);

    logInfo("parsing protos");

    entities = entityPrototypeSchema.array()
        .parse(entities);

    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson.filepath, entities);
};

/**
 * Checks whether entities have been loaded.
 * 
 * @throws {Error} If entities have not been loaded yet.
 */
export function assertEntitiesLoaded() {
    if (!loaded) {
        logFatal({
            msg: `entities loaded assertion failed: entities not loaded`,
            throw: true
        });
    }
}

export function getEntities() {
    assertEntitiesLoaded();

    return entities;
}