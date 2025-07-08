import { getProcessingOutput } from '$src/preset';
import { generateProcessorRunner, type ProcessorArgs } from '$shared/projectProcessor';
import { getEntities } from '$process/processors/entity/entity';

export default generateProcessorRunner(
    'lathe_entity',
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
    const latheEnts = getEntities()
        .filter(e => e.components?.find(comp => comp.type === 'Lathe'));

    writeJsonSync(
        'output',
        getProcessingOutput('lathe_entity', 'lathe_entities_json').relFilepath,
        latheEnts
    );
};