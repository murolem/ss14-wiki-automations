import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { dataPaths, extendedLogging } from '$src/preset';
import { entityDefiningValidator, entityValidator } from '$src/schemas/entities/entity';
import { resolveInheritance } from '$src/schemas/utils';
import { deepCloneObjectUsingJson } from '$src/utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
const logger = new Logger("03/chunks/entities");
const { logInfo, logError, logWarn } = logger;

export default function process() {
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

    addEntitiesToEntitiesList('entities.source.objects', processAndSaveConvertedDataForEntity('entities.source.objects'));
    addEntitiesToEntitiesList('entities.source.clothing', processAndSaveConvertedDataForEntity('entities.source.clothing'));
    addEntitiesToEntitiesList('entities.source.structures', processAndSaveConvertedDataForEntity('entities.source.structures'));
    addEntitiesToEntitiesList('entities.source.tiles', processAndSaveConvertedDataForEntity('entities.source.tiles'));
    addEntitiesToEntitiesList('entities.source.mobs', processAndSaveConvertedDataForEntity('entities.source.mobs'));
    addEntitiesToEntitiesList('entities.source.body.organs', processAndSaveConvertedDataForEntity('entities.source.body.organs'));
    addEntitiesToEntitiesList('entities.source.body.parts', processAndSaveConvertedDataForEntity('entities.source.body.parts'));
    addEntitiesToEntitiesList('entities.source.debugging', processAndSaveConvertedDataForEntity('entities.source.debugging'));
    addEntitiesToEntitiesList('entities.source.catalog.fills', processAndSaveConvertedDataForEntity('entities.source.catalog.fills'));

    // entities only used for inheritance
    // these are to be excluded from being uploaded to the wiki
    addEntitiesToEntitiesList('entities.source.foldable', processAndSaveConvertedDataForEntity('entities.source.foldable'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('entities.source.store.presets', processAndSaveConvertedDataForEntity('entities.source.store.presets'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('entities.source.inventory-templates.inventorybase', processAndSaveConvertedDataForEntity('entities.source.inventory-templates.inventorybase'), { usedForInheritanceOnly: true });
    addEntitiesToEntitiesList('entities.source.markers', processAndSaveConvertedDataForEntity('entities.source.markers'), { usedForInheritanceOnly: true });

    // save imported entities
    processAndSaveConvertedData({
        operationBeforeStartLog: 'saving ALL imported entities',
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'entities.before-processing.all-entities-array',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(enititesList);
        }
    });

    logInfo('processing entities')

    // create a record mapping entity IDs to actual enitites
    const entitiesProcessed = enititesListExcludingInheritanceSpecific
        // create a copy of each entity so that TS won't complain <3
        // and to not affect original entities.
        .map(entry => deepCloneObjectUsingJson(entry) as z.infer<typeof entityValidator>)
        // resolve inheritance where needed
        .map(entry => {
            if (entry.parent) {
                // for inheritance resolving, use the full list of entities
                return resolveInheritance(entry, enititesList, 'parent', 'id', {
                    debugLogChain: extendedLogging["processConvertedData.inheritance-chain"],
                    inheritedPropertiesToDiscard: ['abstract']
                });
            } else {
                return entry;
            }
        })
        // remove abstract entities
        // and entities without IDs (these are used for inheritance)
        .filter(entity => {
            return (entity.abstract === undefined || entity.abstract === false)
                && entity.id !== undefined;
        })
        // remove entities without names
        .filter(entity => {
            if (entity.name === undefined) {
                logInfo(chalk.gray(`skipping entity without name: ID ${chalk.bold(entity.id)} from ${chalk.bold(entityIdsByDataPathAlias[entity.id!])}`));
                return;
            }

            return true;
        });

    // save processed entities
    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'entities.processed.all-entities-array',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(entitiesProcessed);
        }
    });

    logInfo('generating entity mapping ID → name');

    // create a record mapping entity IDs to their names
    const entityNamesByEntityIds = entitiesProcessed
        .reduce((accum, entity) => {
            accum[entity.id!] = entity.name!;

            return accum;
        }, {} as Record<string, string>);

    // save generated mapping
    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'entities.processed.entity-names-by-entity-ids',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(entityNamesByEntityIds);
        }
    });


    logInfo('generating entity mapping name → ID');

    // create a record mapping entity names to their IDs.
    // names are made lowercase.
    const entityIdsByEntityNames = entitiesProcessed
        .reduce((accum, entity) => {
            const nameLowercase = entity.name!.toLocaleLowerCase();

            // skip entities with names that already have been mapped.
            if (accum[nameLowercase]) {
                if (extendedLogging['processConvertedData.currently-being-parsed-files']) {
                    logInfo(chalk.gray(`skipping entity for mapping names → IDs: ID ${chalk.bold(entity.id)} cause the name has already mapped been to entity by ID ${chalk.bold(accum[entity.name!])}`));
                }

                return accum;
            }

            accum[nameLowercase] = entity.id!;

            return accum;
        }, {} as Record<string, string>);

    // save generated mapping
    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'entities.processed.entity-ids-by-lowercase-entity-names',
        processor({ files, parseFiles, writeToOutput }) {
            writeToOutput(entityIdsByEntityNames);
        }
    });

    // ===================

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
}