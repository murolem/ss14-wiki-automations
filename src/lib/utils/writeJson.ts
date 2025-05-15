import fs from 'fs-extra';
import path from 'path';

/** Same as fs.writeJsonSync, but ensures that the write directory exists and prettifies the JSON data before safe (4 spaces). */
export function ensuredWritePrettyJsonSync(pathStr: string, data: unknown): void {
    fs.ensureDirSync(path.parse(pathStr).dir);

    fs.writeJsonSync(pathStr, data, { spaces: 4 });
}