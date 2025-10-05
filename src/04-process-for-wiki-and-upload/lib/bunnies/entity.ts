import { Logger } from '$logger';
import { z } from 'zod';
import chalk from 'chalk';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getProcessingContext, getWikiContext } from '$wiki/lib/bunnies/lib/context';
import { jsonComparatorAsc } from '$utils/writeJson';
const logger = new Logger("wiki/preprocess/entities");
const { logDebug, logInfo, logWarn, logFatalAndThrow } = logger;

export default generateProcessorRunner(
    'entity',
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
    const inputCtxEntitiesJson = getProcessingContext('entity', 'entities_json');
    const outputCtxEntityMapOfIdToName = getWikiContext('entity', 'entity_map_of_id_to_name');
    const outputCtxEntityMapOfLcNameToId = getWikiContext('entity', 'entity_map_of_lc_name_to_id');

    const entities = inputCtxEntitiesJson.loadAndParseData();

    const entitiesSortedBy = {
        id: entities.toSorted((a, b) => a.id.localeCompare(b.id)),
        name: entities.toSorted((a, b) => {
            // put entities without a name at the end
            if (!a.name) {
                return 1;
            } else if (!b.name) {
                return -1;
            }

            return a.name.localeCompare(b.name);
        }),
    }

    /** 
     * Map of entity IDs to their names.
     * 
     * Entities without a name or empty name are discarded.
     * 
     * Writes data with the ID ordering defined in {@link entitiesSortedBy}.
     */
    const entityMapOfIdToName = outputCtxEntityMapOfIdToName.writeData(
        entities.reduce<
            z.infer<typeof outputCtxEntityMapOfIdToName['schema']>
        >((accum, ent) => {
            if (ent.name === undefined || ent.name === "") {
                // many abstract entities don't have a name, which is expected, so do not log about those.
                if (!ent.abstract) {
                    logInfo(chalk.gray(`mapping entity IDs to names, skipping a non-abstract entity without a name: ID ${chalk.bold(ent.id)}`));
                }

                return accum;
            }

            accum[ent.id] = ent.name;

            return accum;
        }, {}),
        jsonComparatorAsc
    );

    /** 
     * Map of entity names in lowercase to their IDs.
     * 
     * Entities without a name or empty name are discarded. 
     * Entities with the same lowercase name are discarded except the first entity,
     * which is determined by the ordering in {@link entitiesSortedBy}.
     * 
     * Writes data with the name ordering defined in {@link entitiesSortedBy}.
     */
    const entityMapOfLcNameToId = outputCtxEntityMapOfLcNameToId.writeData(
        Object.entries(entityMapOfIdToName).reduce<
            z.infer<typeof outputCtxEntityMapOfLcNameToId.schema>
        >((accum, [id, name]) => {
            const nameLc = name.toLocaleLowerCase();

            if (nameLc in accum) {
                logInfo(chalk.gray(`skipping entity ${chalk.bold(id)} while mapping name → ID: name ${chalk.italic(name)} already mapped to ID ${chalk.bold(accum[nameLc])}`));

                return accum;
            }

            accum[nameLc] = id;

            return accum;
        }, {}),
        jsonComparatorAsc
    )
}
