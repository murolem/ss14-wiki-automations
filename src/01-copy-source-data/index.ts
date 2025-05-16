import { toOsPath } from '$utils/toOsPath';
import { importToProject } from './lib/importToProject';

importToProject(toOsPath("Resources/Prototypes"), 'prototypes');

// copyPath(sourceSubstepDirPaths.recipes_lathe);
// copyPath(sourceSubstepDirPaths.recipes_lathe_packs);
// copyPath(sourceSubstepDirPaths.recipes_lathe_categories);
// copyPath(sourceSubstepDirPaths.recipes_lathe_machines);