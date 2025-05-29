import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("wiki/preprocess/entities");
const { logInfo, logWarn, logFatal } = logger;
import { z } from 'zod';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync, type JsonReplacer } from '$utils/writeJson';
import { projectDirpaths, projectProcessingOutputs, projectStepDirpaths, projectWikiOutputs } from '$src/preset';
import path from 'path';
import { entityPrototypeSchema } from '$schemas/prototype/prototypes/entity';

export default function () {
    const {
        filepath: entitiesJsonRelFilepath,
        schema: entitiesJsonSchema
    } = projectProcessingOutputs.entities.entitiesJson;
    const wikiOutput = projectWikiOutputs.entities;
    const entitiesJsonFilepath = path.join(projectStepDirpaths.entities.processed, entitiesJsonRelFilepath);

    if (!fs.existsSync(entitiesJsonFilepath)) {
        logFatal({
            msg: "entities json input file doesn't exist",
            throw: true
        });
    }

    const entities = fs.readJsonSync(entitiesJsonFilepath) as z.infer<typeof entitiesJsonSchema>
    const entitiesSortedByIdFiltered = entities
        .filter(ent => ent.name && ent.name !== "")
        .sort((a, b) => a.id.localeCompare(b.id));

    const entitiesSortedByNameFiltered = entities
        .filter(ent => ent.name && ent.name !== "")
        .sort((a, b) => a.name!.localeCompare(b.name!));

    /** 
     * Map of entity IDs to their names.
     * Only entities with non-empty names get mapped.
     * Based on entities ordered by ID, so the names of those will come first.
     */
    const entity_map_of_id_to_name: z.infer<typeof wikiOutput.entity_map_of_id_to_name.schema> =
        entitiesSortedByIdFiltered.reduce((accum, entity) => {
            if (entity.name === undefined || entity.name === "") {
                // many abstract entities don't have a name, so skip them safely.
                // though not many concrete entities don't have a name - log them just in case.
                if (entity.abstract !== true) {
                    logInfo(chalk.gray(`mapping entity IDs to names, skipping a non-abstract entity without a name: ID ${chalk.bold(entity.id)}`));
                }

                return accum;
            }

            accum[entity.id] = entity.name;

            return accum;
        }, {} as Record<string, string>);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_id_to_name.filepath),
        entity_map_of_id_to_name,
        entitiesSortedByIdFiltered
            .filter(ent => ent.id in entity_map_of_id_to_name)
            .map(ent => ent.id)
    )

    /** 
     * Map of entity names to their IDs.
     * Only entities with non-empty names get mapped.
     * Based on entities ordered by name, so the names of those will come first.
     */
    const entity_map_of_name_to_id: z.infer<typeof wikiOutput.entity_map_of_lc_name_to_id.schema> =
        entitiesSortedByNameFiltered.reduce((accum, ent) => {
            const nameLc = ent.name!.toLocaleLowerCase();

            if (nameLc in accum) {
                logInfo(chalk.gray(`skipping entity ${chalk.bold(ent.id)} while mapping name → ID: name ${chalk.italic(ent.name)} already mapped to ID ${chalk.bold(accum[nameLc])}`));
                return accum;
            }

            accum[nameLc] = ent.id;

            return accum;
        }, {} as Record<string, string>);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_lc_name_to_id.filepath),
        entity_map_of_name_to_id,
        entitiesSortedByNameFiltered
            .filter(ent => ent.name! in entity_map_of_name_to_id)
            .map(ent => ent.name!),
    )
}