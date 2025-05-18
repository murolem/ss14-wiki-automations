import { resolveInheritance } from '$schemas/utils';
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
    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson, entities);
});