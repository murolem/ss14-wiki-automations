// import { resolveInheritance } from '$schemas/utils';
// import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
// import { getPrototypes } from '$src/03-process-converted-data/lib/processors/prototypes';
// import { projectProcessingOutputs } from '$src/preset';
// import { toOsPath } from '$utils/toOsPath';
// import fs from 'fs-extra';

// registerProcessor('entities', ({
//     dirpath: projectDirpath,
//     stepDirpaths: projectStepDirpaths,
//     outputDirpath,
//     tempDirpath,
//     logger,
//     writeJsonSync
// }) => {
//     let orders = getPrototypes()
//         .filter(proto => proto.type === 'cargoProduct');
//     writeJsonSync('temp', 'cargoProduct.json', orders);

//     orders = orders.map(entity => resolveInheritance(entity, orders, 'parent', 'id'));
//     writeJsonSync('output', projectProcessingOutputs.entities.entitiesJson, orders);
// });