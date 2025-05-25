import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { entityPrototypeSchema, type EntityPrototype } from '$schemas/prototype/prototypes/entity';
import { getPrototypes } from '$src/03-process-converted-data/lib/processors/prototypes/index';
import { Logger } from '$logger';
const logger = new Logger("process/processors/entities");
const { logInfo, logFatal } = logger;

let entities: EntityPrototype[] = [];

let loaded = false;

registerProcessor('entities', ({
    dirpath,
    stepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    logInfo("searching for protos");

    let entities = getPrototypes()
        .filter(proto => proto.type === 'entity');

    writeJsonSync('temp', 'entities_raw.json', entities);

    logInfo("parsing protos");

    entities = entityPrototypeSchema.array()
        .parse(entities);

    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson.filepath, entities);
});

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