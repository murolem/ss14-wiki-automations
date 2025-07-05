import path from 'path';

/** 
 * Checks whether given filepath is a YAML file based on extension. 
 * 
 * Does NOT check whether the file exists.
 * */
export function isYamlFile(filepath: string): boolean {
    const ext = path.parse(filepath).ext.toLowerCase();
    return ext === '.yml' || ext === '.yaml';
}