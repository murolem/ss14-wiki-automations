import { loadPrototypes } from './lib/loadPrototypes';
// import { stepAbsDirPaths } from '$src/preset';
// import processEntities from './lib/processors/entities';
import fs from 'fs-extra';
import { loadProcessors, runProcessor } from '$src/03-process-converted-data/lib/processor';

await loadProcessors();

// initial load & parse; not needed, but good to have here.
loadPrototypes();

runProcessor('entities');


// processEntities();
// processRecipes();

// const items =

// convertPath(sourceSubstepDirPaths.prototypes);

// convertPath(sourceSubstepDirPaths.recipes_lathe);
// convertPath(sourceSubstepDirPaths.recipes_lathe_packs);
// convertPath(sourceSubstepDirPaths.recipes_lathe_categories);
// convertPath(sourceSubstepDirPaths.recipes_lathe_machines);