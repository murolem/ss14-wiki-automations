import { ItemGroupProcessResult } from '$src/03-process-converted-data/chunks/items';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { dataPaths, extendedLogging } from '$src/preset';
import { entityDefiningValidator, entityValidator } from '$src/schemas/entities/entity';
import { resolveInheritance } from '$src/schemas/utils';
import { deepCloneObjectUsingJson } from '$src/utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
const logger = new Logger("03/chunks/items/entities");
const { logInfo, logError, logWarn } = logger;

export default function process(): ItemGroupProcessResult {
    /** list of all entities. */
    const enititesList: z.infer<typeof entityValidator>[] = [];
    const enititesListExcludingInheritanceSpecific: z.infer<typeof entityValidator>[] = [];
    const entityIdsByDataPathAlias: Record<string, string> = {}

    function addEntitiesToEntitiesList(
        dataPathAlias: keyof typeof dataPaths,
        entitiesToAdd: z.infer<typeof entityValidator>[],
        {
            usedForInheritanceOnly = false
        }: Partial<{
            usedForInheritanceOnly: boolean
        }> = {}
    ): void {
        enititesList.push(...entitiesToAdd);

        if (!usedForInheritanceOnly) {
            enititesListExcludingInheritanceSpecific.push(...entitiesToAdd);
        }

        for (const entity of entitiesToAdd) {
            if (entity.id) {
                entityIdsByDataPathAlias[entity.id] = dataPathAlias;
            }
        }
    }

    addEntitiesToEntitiesList('item.source.entities.objects', processAndSaveConvertedDataForEntity('item.source.entities.objects'));
    addEntitiesToEntitiesList('item.source.entities.clothing', processAndSaveConvertedDataForEntity('item.source.entities.clothing'));
    addEntitiesToEntitiesList('item.source.entities.structures', processAndSaveConvertedDataForEntity('item.source.entities.structures'));
    addEntitiesToEntitiesList('item.source.entities.tiles', processAndSaveConvertedDataForEntity('item.source.entities.tiles'));
    addEntitiesToEntitiesList('item.source.entities.mobs', processAndSaveConvertedDataForEntity('item.source.entities.mobs'));
    addEntitiesToEntitiesList('item.source.entities.body.organs', processAndSaveConvertedDataForEntity('item.source.entities.body.organs'));
    addEntitiesToEntitiesList('item.source.entities.body.parts', processAndSaveConvertedDataForEntity('item.source.entities.body.parts'));
    addEntitiesToEntitiesList('item.source.entities.debugging', processAndSaveConvertedDataForEntity('item.source.entities.debugging'));
    addEntitiesToEntitiesList('item.source.entities.catalog.fills', processAndSaveConvertedDataForEntity('item.source.entities.catalog.fills'));

    // entities only used for inheritance.
    // these are to be excluded from being uploaded to the wiki.
    addEntitiesToEntitiesList('item.source.entities.foldable', processAndSaveConvertedDataForEntity('item.source.entities.foldable'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('item.source.entities.store.presets', processAndSaveConvertedDataForEntity('item.source.entities.store.presets'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('item.source.entities.inventory-templates.inventorybase', processAndSaveConvertedDataForEntity('item.source.entities.inventory-templates.inventorybase'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('item.source.entities.markers', processAndSaveConvertedDataForEntity('item.source.entities.markers'), { usedForInheritanceOnly: true });

    // save imported entities
    processAndSaveConvertedData({
        operationBeforeStartLog: 'saving ALL imported entities',
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'item.processed.entities.all-entities-raw-array',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(enititesList);
        }
    });

    // apply processing
    const entitiesProcessed = processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'item.processed.entities.entities-array',
        processor({ writeToOutput }) {
            const entitiesProcessed = enititesListExcludingInheritanceSpecific
                // make copies to make changes
                .map(entry => deepCloneObjectUsingJson(entry) as z.infer<typeof entityValidator>)
                // resolve inheritance
                .map(entry => resolveInheritance(entry, enititesList, 'parent', 'id', {
                    discardProperties: ['parent'],
                    discardInheritedProperties: ['abstract', 'id'],
                    debugLogChain: extendedLogging["processConvertedData.inheritance-chain"]
                }))
                // get rid of abstracts
                .filter(reagent => !reagent.abstract)

            writeToOutput(entitiesProcessed);

            return entitiesProcessed;
        }
    });

    // convert to resulting format
    const itemNamesByItemIds = entitiesProcessed
        .reduce((accum, entity) => {
            if (entity.id === undefined) {
                logError("undefined entity ID", {
                    throwErr: true,
                    additional: entity
                });
                throw ''//type guard
            } else if (entity.name === undefined) {
                // skip entities without an name
                logWarn(chalk.gray(`skipping entity without a name: ID ${chalk.bold(entity.id)} from ${chalk.bold(entityIdsByDataPathAlias[entity.id])}`));

                return accum;
            }

            accum[entity.id] = entity.name;

            return accum;
        }, {} as ItemGroupProcessResult['itemNamesByItemIds']);

    return {
        itemNamesByItemIds
    }
}

function processAndSaveConvertedDataForEntity(
    dataPathAlias: keyof typeof dataPaths,
) {
    return processAndSaveConvertedData({
        convertedDataPathAlias: dataPathAlias,
        outputDataPathAlias: dataPathAlias,
        processor({ files, parseFiles, writeToOutput }) {
            const entities = parseFiles(files,
                entityDefiningValidator,
                entityValidator
            );

            writeToOutput(entities);

            return entities;
        }
    });
}