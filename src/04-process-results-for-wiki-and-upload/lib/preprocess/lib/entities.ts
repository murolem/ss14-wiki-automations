import { prototypeArraySchema } from '$schemas/prototype';
import { outputSubstepDirPaths, stepAbsDirPaths, uploadSubstepDirPaths } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
const logger = new Logger("04/preprocess/entities");
const { logInfo, logWarn, logError } = logger;
import { z } from 'zod';
import chalk from 'chalk';
import { ensuredWritePrettyJsonSync } from '$utils/writeJson';

export default function () {
    const importFilePath = toOsPath(`${stepAbsDirPaths.outputData}/${outputSubstepDirPaths.entities}/${outputSubstepDirPaths.entities_inheritance_resolved}`);
    const exportDirPath = toOsPath(`${stepAbsDirPaths.wikiUploadData}/${uploadSubstepDirPaths.entities}`)

    const entities = prototypeArraySchema.parse(fs.readJsonSync(importFilePath));

    // for upload
    const entityNamesByEntityIds = entities.reduce((accum, entity) => {
        if (entity.id === undefined) {
            logError({
                msg: "undefined entity ID",
                throw: true,
                data: entity
            });
            throw ''//type guard
        } else if (entity.name === undefined && !entity.abstract) {
            // skip entities without an name
            logWarn(chalk.gray(`skipping entity without a name: ID ${chalk.bold(entity.id)}`));

            return accum;
        }

        accum[entity.id] = typeof entity.name === 'string'
            ? entity.name
            : "";

        return accum;
    }, {} as Record<string, string>);

    ensuredWritePrettyJsonSync(
        toOsPath(`${exportDirPath}/${uploadSubstepDirPaths.entities_ids_to_names}`),
        entityNamesByEntityIds
    );


    // for upload
    const entityIdsByEntityNames = Object.entries(entityNamesByEntityIds).reduce((accum, [ID, name]) => {
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


    ensuredWritePrettyJsonSync(
        toOsPath(`${exportDirPath}/${uploadSubstepDirPaths.entities_lc_names_to_ids}`),
        entityIdsByEntityNames
    );
}