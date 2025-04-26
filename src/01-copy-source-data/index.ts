import { copyPath } from '$src/01-copy-source-data/lib/copyPath';
import { sourceSubstepDirPaths } from '$src/preset';
import { stepAbsDirPaths } from '$src/preset';
import fs from 'fs-extra';

const ss14AbsDirPath = stepAbsDirPaths.ss14Repo;
const inputDataAbsDirPath = stepAbsDirPaths.inputData;

fs.emptyDirSync(inputDataAbsDirPath);

// define a bunch of paths
copyPath(sourceSubstepDirPaths.recipes_lathe);
copyPath(sourceSubstepDirPaths.recipes_lathe_packs);
copyPath(sourceSubstepDirPaths.recipes_lathe_categories);
copyPath(sourceSubstepDirPaths.recipes_lathe_machines);