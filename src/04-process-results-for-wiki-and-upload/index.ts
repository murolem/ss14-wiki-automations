import fs from 'fs-extra';
import preprocess from './lib/preprocess';
import diff from './lib/diff';
// import upload from './lib/upload';

preprocess();
await diff();
// await upload();