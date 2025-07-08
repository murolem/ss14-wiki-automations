import fs from 'fs-extra';
import path from 'path';
import stringify, { type Comparator } from 'json-stable-stringify';

export type JsonReplacer =
    ((key: unknown, value: unknown) => unknown);

export type JsonComparator = Comparator;

/** A comparator sorting by keys ascending. */
export const jsonComparatorAsc: JsonComparator = (a, b) => a.key.localeCompare(b.key);

/** 
 * Returns a comparator sorting by keys ascending in specified order.
 * 
 * If a key is not in the order array, then it will be placed after the sorted keys, if any.
 */
export const getJsonComparatorWithExplicitOrder: ((order: (string | number)[]) => JsonComparator) =
    (order) => {
        return (a, b) => {
            const aIdx = order.indexOf(a.key);
            const bIdx = order.indexOf(b.key);
            return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
        }
    }

/** Same as fs.writeJsonSync, but ensures that the write directory exists and prettifies the JSON data before save (4 spaces). */
export function ensuredWritePrettyJsonSync(
    pathStr: string,
    data: unknown,
    opts?: {
        replacer?: JsonReplacer,
        comparator?: JsonComparator
    }
): void {
    fs.ensureDirSync(path.parse(pathStr).dir);

    fs.writeFileSync(
        pathStr,
        stringify(
            data,
            {
                cmp: opts?.comparator,
                replacer: opts?.replacer,
                space: 4
            }
        ) ?? ''
    );
}