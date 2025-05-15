import { loadPrototypes } from './lib/loadPrototypes';
import { stepAbsDirPaths } from '$src/preset';
import processEntities from './lib/process/entities';
import fs from 'fs-extra';

fs.emptyDirSync(stepAbsDirPaths.outputData);

// initial load & parse; not needed, but good to have here.
loadPrototypes();

processEntities();
// processRecipes();

// const items =

// convertPath(sourceSubstepDirPaths.prototypes);

// convertPath(sourceSubstepDirPaths.recipes_lathe);
// convertPath(sourceSubstepDirPaths.recipes_lathe_packs);
// convertPath(sourceSubstepDirPaths.recipes_lathe_categories);
// convertPath(sourceSubstepDirPaths.recipes_lathe_machines);