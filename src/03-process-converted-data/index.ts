import { loadPrototypes } from './lib/loadPrototypes';
import { outputSubstepDirPaths, sourceSubstepDirPaths } from '$src/preset';
import { stepAbsDirPaths } from '$src/preset';
import fs from 'fs-extra';

fs.emptyDirSync(stepAbsDirPaths.outputData);

// initial load & parse; not needed, but good to have here.
loadPrototypes();

// convertPath(sourceSubstepDirPaths.prototypes);

// convertPath(sourceSubstepDirPaths.recipes_lathe);
// convertPath(sourceSubstepDirPaths.recipes_lathe_packs);
// convertPath(sourceSubstepDirPaths.recipes_lathe_categories);
// convertPath(sourceSubstepDirPaths.recipes_lathe_machines);