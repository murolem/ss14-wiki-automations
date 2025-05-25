import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { entityPrototypeSchema } from '$schemas/prototype/prototypes/entity';
import { getPrototypes } from '$src/03-process-converted-data/lib/processors/prototypes/index';

registerProcessor('entities', ({
    dirpath,
    stepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    let entities = getPrototypes()
        .filter(proto => proto.type === 'entity');

    writeJsonSync('temp', 'entities_raw.json', entities);

    entities = entityPrototypeSchema.array()
        .parse(entities);

    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson, entities);
});