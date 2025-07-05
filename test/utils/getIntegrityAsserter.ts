import { deepCloneObjectUsingJson } from '$src/utils';
import { expect } from 'vitest';

/** 
 * Creates an integrity checker function for an object.
 * 
 * Returns a function that you pass the original object at a later time
 * to check whether it has changed.
 */
export function getIntegrityAsserter(obj: object) {
    const originalCopy = deepCloneObjectUsingJson(obj);
    return (obj: object) => expect(obj).toStrictEqual(originalCopy);
}