import { mergeJsonObjects } from '$src/utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
const logger = new Logger("utils (/src/schemas)");
const { logInfo, logError } = logger;
import { z } from 'zod';

/** 
 * Given an object `doc` that inherits from other object or objects,
 * produces a new object with the inheritance chain resolved: new props added, existing props replaced/merged - 
 * all according to the chain of parents.
 * 
 * List of potential parents is defined with `parentsPool`.
 * 
 * Name of the property that contains ID of object (a string) or multiple IDs (an array) 
 * that `doc` is inherited from is defined with `parentFieldName`.
 * 
 * Name of the property that each object holds its ID in is defined with `idFieldName`.
 * 
 * The inheritance chain is resolved left to right, with `doc` being the last in the chain:
 * 1. The first object is taken as-is.
 * 2. Second and further objects, including the `doc` objects itself, are "layered on top", 
 * one after another, using the algorithm describe below.
 * 
 * For the algorithm used in name conflicts, refer to {@link mergeJsonObjects}.
 */
export function resolveInheritance<T extends Record<string, unknown>>(
    doc: T,
    parentsPool: T[],
    parentFieldName: keyof T,
    idFieldName: keyof T,
    {
        debugLogChain = false,
        excludeProperties = [],
        inheritedPropertiesToDiscard = [],
        _depth = 0
    }: Partial<{
        debugLogChain: boolean,
        excludeProperties: string[],
        inheritedPropertiesToDiscard: string[],
        _depth: number
    }> = {}
): T {
    let parentsDocIds: unknown = doc[parentFieldName];
    // if no parents defined for the doc = no resolving is needed
    if (parentsDocIds === undefined) {
        return doc;
    } else if (typeof parentsDocIds === 'string') {
        // if parents field is a string, then it's a single parent
        parentsDocIds = [parentsDocIds]
    }

    try {
        z.string().array()
            .parse(parentsDocIds);
    } catch (err) {
        // otherwise we expect an array
        logError(`failed to resolve inheritance: expected parents field name to be a string for a single parent or an array for multiple, got ${typeof parentsDocIds}`, {
            throwErr: true,
            additional: {
                doc,
                parentFieldName,
                idFieldName
            }
        });
        throw '' // type guard
    }

    const docId = doc[idFieldName];
    try {
        z.string().parse(docId);
    } catch (err) {
        // otherwise we expect an array
        logError(`failed to resolve inheritance: expected document to have its ID defined in field ${chalk.bold(idFieldName)}`, {
            throwErr: true,
            additional: {
                doc,
                parentFieldName,
                idFieldName
            }
        });
        throw '' // type guard
    }

    // ======================

    if (debugLogChain) {
        if (_depth === 0) {
            logInfo(`solving inheritance for doc ID: ${chalk.bold(docId)}`);
        } else {
            logInfo('|' + ' '.repeat(_depth * 4) + `- ${chalk.bold(docId)}`);
        }
    }

    // first, iterate over each parent,
    // building the "base" step-by-step

    let resultDoc = {} as any
    // "for of" doesn't work here for some reason 🤔
    // bluespace tech interfering once again, RAAAAAAAAAAA
    for (let i = 0; i < (parentsDocIds as string[]).length; i++) {
        const parentDocId = (parentsDocIds as string[])[i];

        const matchingParentDoc = parentsPool.find(doc => doc[idFieldName] === parentDocId);
        if (!matchingParentDoc) {
            logError(`failed to resolve inheritance: parent with ID ${chalk.bold(parentDocId)} was not found`, {
                throwErr: true,
                additional: {
                    doc,
                    parentFieldName,
                    idFieldName
                }
            });
            throw ''//type guard
        }

        resultDoc = mergeJsonObjects(
            resultDoc,
            resolveInheritance(
                matchingParentDoc,
                parentsPool,
                parentFieldName,
                idFieldName,
                {
                    debugLogChain,
                    _depth: _depth + 1
                }
            )
        );
    }

    // remove properties from the inheritance chain before merge
    // that need to be removed.
    for (const propertyToRemove of inheritedPropertiesToDiscard) {
        if (propertyToRemove in resultDoc) {
            delete resultDoc[propertyToRemove];
        }
    }

    // after the "base" is fully constructed,
    // merge the main doc on top

    resultDoc = mergeJsonObjects(
        resultDoc,
        doc
    );

    // remove any props needed to be excluded from the final doc
    for (const propertyToExclude of excludeProperties) {
        if (propertyToExclude in resultDoc) {
            delete resultDoc[propertyToExclude];
        }
    }

    return resultDoc;
}

