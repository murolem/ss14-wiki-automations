import { entityPrototypeSchema } from '$schemas/prototype/entity';
import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { getPrototypes } from '$src/03-process-converted-data/lib/processors/prototypes';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';

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

    entities = entities
        .map(proto => entityPrototypeSchema.parse(proto));

    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson, entities);
});