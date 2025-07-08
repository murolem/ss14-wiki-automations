import path from 'path';

/** 
 * Replaces file extension in given path string.
 * 
 * Does NOT replace actual file extension nor checks whether file at given path exists.
 * 
 * @param filepath File path.
 * @param newExtension New extension, including the dot `.`. 
 * @returns File path with new extension.
 */
export function replacePathExtension(filepath: string, newExtension: string): string {
    return filepath = filepath.substring(
        0,
        filepath.length - path.parse(filepath).ext.length
    ) + newExtension;
}