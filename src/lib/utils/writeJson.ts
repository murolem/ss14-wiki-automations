import fs from 'fs-extra';
import path from 'path';

export type JsonReplacer =
    ((key: unknown, value: unknown) => unknown)
    | string[];

/** Same as fs.writeJsonSync, but ensures that the write directory exists and prettifies the JSON data before save (4 spaces). */
export function ensuredWritePrettyJsonSync(
    pathStr: string,
    data: unknown,
    replacer?: JsonReplacer
): void {
    fs.ensureDirSync(path.parse(pathStr).dir);

    fs.writeJsonSync(
        pathStr,
        data, {
        spaces: 4,
        // @ts-ignore you FINE
        replacer
    });
}