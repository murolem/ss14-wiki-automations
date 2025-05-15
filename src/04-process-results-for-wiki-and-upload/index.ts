import { stepAbsDirPaths } from '$src/preset';
import fs from 'fs-extra';
import preprocess from './lib/preprocess';
import diff from './lib/diff';
import upload from './lib/upload';

fs.emptyDirSync(stepAbsDirPaths.wikiUploadData);

preprocess();
diff();
await upload();