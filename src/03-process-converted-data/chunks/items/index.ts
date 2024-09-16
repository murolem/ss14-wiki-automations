import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { extendedLogging } from '$src/preset';
import { mergeJsonObjects } from '$src/utils';
import chalk from 'chalk';
import processEntities from './entities';
import processReagents from './reagents';
import Logger from '@aliser/logger';
const logger = new Logger("03/chunks/items");
const { logInfo, logError, logWarn } = logger;

export type ItemGroupProcessResult = {
    itemNamesByItemIds: Record<string, string>
}

export default function process(): void {
    const results: ItemGroupProcessResult[] = [
        processEntities(),
        processReagents(),
    ];

    logInfo('generating item mapping: ID → name');

    // create a record mapping entity IDs to their names
    const entityNamesByEntityIds = results
        .reduce((accum, result, i) => {
            for (const [key, value] of Object.entries(result.itemNamesByItemIds)) {
                if (key in accum) {
                    logError(`failed to generate an item mapping ID → name: encountered duplicate key ${chalk.bold(key)} while iteration over result at index ${chalk.bold('#' + i)}`, {
                        throwErr: true
                    });
                    throw ''//type guard
                }

                accum[key] = value;
            }

            return accum;
        }, {} as Record<string, string>);

    // save generated mapping
    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'item.processed.entities.entity-names-by-entity-ids',
        processor({ writeToOutput }) {
            writeToOutput(entityNamesByEntityIds);
        }
    });


    logInfo('generating item mapping: name → ID');

    // create a record mapping entity names to their IDs.
    // names are made lowercase.
    const entityIdsByEntityNames = Object.entries(entityNamesByEntityIds)
        .reduce((accum, [itemId, itemName]) => {
            const itemNameLowercase = itemName!.toLocaleLowerCase();

            // skip entities with names that already have been mapped.
            if (accum[itemNameLowercase]) {
                if (extendedLogging['processConvertedData.currently-being-parsed-files']) {
                    logInfo(chalk.gray(`skipping an item for mapping names → IDs: item name ${chalk.bold(itemName)} was already mapped to item ID ${chalk.bold(accum[itemNameLowercase])}`));
                }
            } else {
                accum[itemNameLowercase] = itemId;
            }


            return accum;
        }, {} as Record<string, string>);

    // save generated mapping
    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'item.processed.entities.entity-ids-by-lowercase-entity-names',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(entityIdsByEntityNames);
        }
    });
}
