import { getProcessingOutput } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { cargoProductRawProtoSchema, cargoProductProcessedProtoSchema, type CargoProductProcessedProtoSchema } from '$schemas/prototype/prototypes/cargoProduct';
import { schemaParse } from '$schemas/utils/assertSchema';
import { generateProcessorRunner, type Processor, type ProcessorArgs } from '$shared/projectProcessor';
import { filterProtosByType, filterProtosByTypeWithParse, tryGetProtoByIdWithParse } from '$process/processors/prototype/getProto';
import { locRecordProperty } from '$process/processors/locale';
import { tryGetCompWithParse } from '$process/processors/prototype/getComp';

export default generateProcessorRunner(
    'lathe_recipe',
    'processed',
    'processed_temp',
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
    const recipes = filterProtosByTypeWithParse('latheRecipe');
    const recipePacks = filterProtosByTypeWithParse('latheRecipePack');

    writeJsonSync(
        'output',
        getProcessingOutput('lathe_recipe', 'recipes_json').relFilepath,
        recipes
    );

    writeJsonSync(
        'output',
        getProcessingOutput('lathe_recipe', 'recipe_packs_json').relFilepath,
        recipePacks
    );
};