import { resolveInheritance } from '$schemas/utils';
import { loadPrototypes } from '$src/03-process-converted-data/lib/loadPrototypes';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';

registerProcessor('entities', ({
    prototypes,
    projectDirpath,
    projectStepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    let entities = prototypes
        .filter(proto => proto.type === 'entity');
    writeJsonSync('temp', 'entities_raw.json', entities);

    entities = entities.map(entity => resolveInheritance(entity, entities, 'parent', 'id'));
    writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson, entities);
});