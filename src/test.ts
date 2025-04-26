import fs from 'fs-extra';
import { toOsPath } from '$utils/toOsPath';
import { yamlSchema } from '$src/02-convert-source-data-to-json/lib/yamlSchema';
import yaml from 'js-yaml';

const cwd = process.cwd();
const csd = import.meta.dirname;

const ymlStr = fs.readFileSync(toOsPath(`${csd}/test.yml`)).toString('utf-8');

const doc = yaml.load(ymlStr, {
    schema: yamlSchema
});

console.log(JSON.stringify(doc, null, 4));
