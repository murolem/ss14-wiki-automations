import { Logger } from '$logger';
import { z } from 'zod';
import chalk from 'chalk';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getProcessingContext, getWikiContext } from '$wiki/lib/bunnies/lib/context';
import { getJsonComparatorWithExplicitOrder, jsonComparatorAsc } from '$utils/writeJson';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { tryGetComp, tryGetCompWithParse } from '$process/processors/entity/getComp';
import { createArrayOrderFromOrderRecord } from '$utils/createArrayOrderFromRecordOrder';
const logger = new Logger("wiki/preprocess/entities");
const { logDebug, logInfo, logWarn, logFatal } = logger;

export default generateProcessorRunner(
    'crafting_station',
    'wiki_upload',
    'wiki_upload_temp',
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
    const ictxLathesConfigs = getWikiContext('crafting_station_lathes_configs', 'lathes_configs');
    const octxConfigs = getWikiContext('crafting_station', 'crafting_stations_configs');

    const latheConfigs = ictxLathesConfigs.loadAndParseData();

    type SingularConfig = z.infer<typeof octxConfigs.schema>[number];

    // define as record so that we can enforce all properties to be listed
    const orderAsRecord: Record<keyof SingularConfig, number> = {
        stationType: 1,
        id: 2,
        timeMultiplier: 3,
        defaultProductionAmount: 4,
        materialUseMultiplier: 5,
        staticRecipes: 6,
        dynamicRecipes: 7,
        emagStaticRecipes: 8,
        emagDynamicRecipes: 9
    };

    const res: z.infer<typeof octxConfigs.schema> = [
        ...latheConfigs
    ];

    res.forEach(cfg => {
        cfg.staticRecipes?.sort();
        cfg.dynamicRecipes?.sort();
        cfg.emagStaticRecipes?.sort();
        cfg.emagDynamicRecipes?.sort();
    })

    octxConfigs.writeData(
        [
            ...latheConfigs
        ],
        // this is so horrible 
        getJsonComparatorWithExplicitOrder(
            createArrayOrderFromOrderRecord(orderAsRecord)
        )
    );
}