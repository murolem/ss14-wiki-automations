import { copyPath } from './lib/copyPath';
import { sourceSubstepDirPaths } from '$src/preset';
import { stepAbsDirPaths } from '$src/preset';
import fs from 'fs-extra';

fs.emptyDirSync(stepAbsDirPaths.inputData);

copyPath(sourceSubstepDirPaths.prototypes);

// copyPath(sourceSubstepDirPaths.recipes_lathe);
// copyPath(sourceSubstepDirPaths.recipes_lathe_packs);
// copyPath(sourceSubstepDirPaths.recipes_lathe_categories);
// copyPath(sourceSubstepDirPaths.recipes_lathe_machines);