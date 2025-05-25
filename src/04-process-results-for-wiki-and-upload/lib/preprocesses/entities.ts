import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("wiki/preprocess/entities");
const { logInfo, logWarn, logError } = logger;
import { z } from 'zod';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync } from '$utils/writeJson';
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
        logError({
            msg: "entities json input file doesn't exist",
            throw: true
        });
    }

    const entities = fs.readJsonSync(entitiesJsonFilepath) as z.infer<typeof entitiesJsonSchema>;

    const entity_map_of_id_to_name = entities.reduce((accum, entity) => {
        if (entity.name === undefined || entity.name === "") {
            // many abstract entities don't have a name, so skip them safely.
            // though not many concrete entities don't have a name - log them just in case.
            if (entity.abstract !== true) {
                logWarn(chalk.gray(`mapping entity IDs to names, skipping a non-abstract entity without a name: ID ${chalk.bold(entity.id)}`));
            }

            return accum;
        }

        accum[entity.id] = entity.name;

        return accum;
    }, {} as Record<string, string>);

    // validate
    wikiOutput.entity_map_of_id_to_name.schema.parse(entity_map_of_id_to_name);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_id_to_name.filepath),
        entity_map_of_id_to_name
    );


    const entity_map_of_name_to_id = Object.entries(entity_map_of_id_to_name).reduce((accum, [ID, name]) => {
        const nameLc = name.toLocaleLowerCase();

        if (nameLc === "") {
            logInfo(chalk.gray(`skipping entity ${chalk.bold(ID)} while mapping name → ID: name is empty`));
            return accum;
        } else if (nameLc in accum) {
            logInfo(chalk.gray(`skipping entity ${chalk.bold(ID)} while mapping name → ID: name ${chalk.italic(name)} already mapped to ${chalk.bold(accum[nameLc])}`));
            return accum;
        }

        accum[nameLc] = ID;

        return accum;
    }, {} as Record<string, string>);

    // validate
    wikiOutput.entity_map_of_name_to_id.schema.parse(entity_map_of_name_to_id);

    // save
    ensuredWritePrettyJsonSync(
        path.join(projectStepDirpaths.entities.wiki_upload, wikiOutput.entity_map_of_name_to_id.filepath),
        entity_map_of_name_to_id
    );
}