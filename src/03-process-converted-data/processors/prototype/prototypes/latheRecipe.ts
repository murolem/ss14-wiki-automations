import { getProcessingOutput } from '$src/preset';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { filterProtosByTypeWithParse } from '$process/processors/prototype/getProto';

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