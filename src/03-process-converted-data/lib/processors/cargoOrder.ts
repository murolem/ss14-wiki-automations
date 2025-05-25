import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { locRecordProperty } from '$src/03-process-converted-data/lib/processors/locale';
import { projectProcessingOutputs } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { cargoProductRawProtoSchema, cargoProductProcessedProtoSchema, type CargoProductProcessedProtoSchema } from '$schemas/prototype/prototypes/cargoProduct';
import { schemaParse } from '$schemas/utils/assertSchema';
import { tryGetCompWithParse } from '$src/03-process-converted-data/lib/processors/prototypes/getComp';
import { filterProtosByType, tryGetProtoByIdWithParse } from '$src/03-process-converted-data/lib/processors/prototypes/getProto';
import { getPrototypes } from '$src/03-process-converted-data/lib/processors/prototypes/index';
import { yamlTypeFieldName } from '$schemas/core/yamlSchema';

registerProcessor('cargo_orders', ({
    dirpath: projectDirpath,
    stepDirpaths: projectStepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    const ordersRaw = filterProtosByType('cargoProduct');
    writeJsonSync('temp', 'cargoProduct_raw.json', ordersRaw);

    const ordersParsed = ordersRaw
        .map(proto => schemaParse(cargoProductRawProtoSchema, proto));
    writeJsonSync('temp', 'cargoProduct_parsed.json', ordersRaw);

    const orders: CargoProductProcessedProtoSchema[] = [];
    for (const orderParsed of ordersParsed) {
        // @ts-ignore convenience; should be later validated
        const order: CargoProductProcessedProtoSchema = {
            ...orderParsed
        };

        // make modifications

        locRecordProperty(order, { property: 'category' });

        const productProto = tryGetProtoByIdWithParse('entity', orderParsed.product);
        if (productProto?.description) {
            order.description = productProto.description;
        }

        if (productProto) {
            const storageFillComp = tryGetCompWithParse(productProto, 'StorageFill');
            if (storageFillComp) {
                order.contents = [];
                for (const entry of storageFillComp.contents) {
                    order.contents.push(entry);
                }
            }

            // const entityTableContainerFillComponent = tryGetCompWithParse(productProto, 'EntityTableContainerFill');
            // if (entityTableContainerFillComponent) {
            //     order.contents = [];
            //     for (const [containerKey, selector] of Object.entries(entityTableContainerFillComponent.containers)) {
            //         const type = selector[yamlTypeFieldName];
            //         // selector
            //         // selector.tabl
            //         // order.contents.push(selector);
            //     }
            // }
        }

        // validate and push
        orders.push(schemaParse(cargoProductProcessedProtoSchema, order));
    }

    orders.sort((a, b) => a.id.localeCompare(b.id));

    writeJsonSync('output', projectProcessingOutputs.cargo_orders.ordersJson, orders);
});