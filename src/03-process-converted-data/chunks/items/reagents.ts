import { ItemGroupProcessResult } from '$src/03-process-converted-data/chunks/items';
import { localizeRecordProperty, lookupLocalizedStringByKey } from '$src/03-process-converted-data/localizer';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { extendedLogging } from '$src/preset';
import { reagentValidator } from '$src/schemas/reagent/reagent';
import { resolveInheritance } from '$src/schemas/utils';
import { deepCloneObjectUsingJson } from '$src/utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
const logger = new Logger("03/chunks/items/reagents");
const { logInfo, logError, logWarn } = logger;

export default function process(): ItemGroupProcessResult {
    const reagentsProcessed = processAndSaveConvertedData({
        convertedDataPathAlias: 'item.source.reagents',
        outputDataPathAlias: 'item.source.reagents',
        processor({ files, parseFiles, writeToOutput }) {
            const reagentsParsed = parseFiles(files, reagentValidator);

            const reagentsProcessed =
                reagentsParsed
                    // make copies to make changes
                    .map(reagent => deepCloneObjectUsingJson(reagent) as typeof reagent)
                    // resolve inheritance
                    .map(reagent => resolveInheritance(reagent, reagentsParsed, 'parent', 'id', {
                        discardProperties: ['parent'],
                        discardInheritedProperties: ['abstract', 'id'],
                        debugLogChain: extendedLogging["processConvertedData.inheritance-chain"]
                    }))
                    // get rid of abstracts
                    .filter(reagent => !reagent.abstract)
                    // localize
                    .map(reagent => {
                        if (!reagent.name || !reagent.desc) {
                            logError(`failed to localize reagent: expected name/desc to be present for reagent with ID '${reagent.id}'`, {
                                throwErr: true,
                                additional: reagent
                            });
                            throw ''//type guard
                        }

                        localizeRecordProperty(reagent, { property: 'name' });
                        localizeRecordProperty(reagent, { property: 'desc' });
                        localizeRecordProperty(reagent, { property: 'physicalDesc' });


                        return reagent;
                    });

            writeToOutput(reagentsProcessed);

            return reagentsProcessed;
        }
    });


    // convert to resulting format
    const itemNamesByItemIds = reagentsProcessed.reduce((accum, reagent) => {
        if (reagent.name === undefined) {
            // skip reagents without an name
            logWarn(chalk.gray(`skipping reagent without a name: ID ${chalk.bold(reagent.id)}`));

            return accum;
        }

        // prefix all reagents with this to avoid name collisions
        const id = `Reagent.${reagent.id}`;

        accum[id] = reagent.name;

        return accum;
    }, {} as ItemGroupProcessResult['itemNamesByItemIds']);

    return {
        itemNamesByItemIds
    }
}