import fs from 'fs-extra';
import preprocess from './lib/preprocess';
import diff from './lib/diff';
import prMake from './lib/prMake';
import prMergeWithCleanup from './lib/prMergeWithCleanup';
import upload from './lib/upload';

// import upload from './lib/upload';

preprocess();
await diff();
await prMake();
await upload();
await prMergeWithCleanup();