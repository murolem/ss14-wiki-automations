import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { locRecordProperty } from '$src/03-process-converted-data/lib/processors/locale';
import { getPrototypes, tryGetProtoById } from '$src/03-process-converted-data/lib/processors/prototypes';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';

registerProcessor('cargo_orders', ({
    dirpath: projectDirpath,
    stepDirpaths: projectStepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    const protos = getPrototypes();

    let orders = protos
        .filter(proto => proto.type === 'cargoProduct');
    writeJsonSync('temp', 'cargoProduct_raw.json', orders);

    orders.forEach(order => {
        locRecordProperty(order, { property: 'category' });

        const productProto = tryGetProtoById('entity', order.product);
        order.description = productProto?.description ?? "";
        // order.proto = productProto;
    });
    writeJsonSync('output', projectProcessingOutputs.cargo_orders.ordersJson, orders);
});