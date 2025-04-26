import { convertPath } from './lib/convertPath';
import { sourceSubstepDirPaths } from '$src/preset';
import { stepAbsDirPaths } from '$src/preset';
import fs from 'fs-extra';

fs.emptyDirSync(stepAbsDirPaths.convertedData);

convertPath(sourceSubstepDirPaths.recipes_lathe);
convertPath(sourceSubstepDirPaths.recipes_lathe_packs);
convertPath(sourceSubstepDirPaths.recipes_lathe_categories);
convertPath(sourceSubstepDirPaths.recipes_lathe_machines);