import { deepCloneObjectUsingJson } from '$src/utils';
import { Logger } from '$logger';
const logger = new Logger("schemas/utils");
const { logInfo, logFatal } = logger;
import type { Prototype } from '$schemas/prototype';
import { mergeJsonObjects, type ArrayOnArrayStrategyResolver, type Strategy } from '$utils/mergeJsonObjects';



/** 
 * Resolves inheritance for a prototype.
 * 
 * Each `parent` is walked recursively until a root prototype is found.
 * The resulting tree is merged sequentially using {@link mergeJsonObjects}.
 * 
 * Merge follows this logic:
 * * Primitive types (string, number, etc.) are replaced.
 * * Arrays are merged.
 * * Maps are merged (following the same merge logic).
 * 
 * After all is done:
 * * `abstract` field is removed unless it's present on the initial proto.
 * * `parent` field is removed in all cases.
 * 
 * This implementation is likely not entirely correct to the actual implementation 
 * (because I looked at it and couldn't figure out what the hell is going on 
 * and I'm not asking again for the 10th time unless this implementation is found to be sucking total ass 
 * then maybe yes I will bother some people that know what is going on or can explain it :3 ).
 * 
 * @param proto Prototype to resolve inheritance for.
 * @param protoPool An array of potential parent prototypes.
 * @param _depth [INTERNAL] Recursion depth counter.
 * @returns A new prototype with resolved inheritance.
 */
export function resolveInheritance<T extends Prototype>(
    proto: T,
    protoPool: T[],
    _depth = 0
): T {
    let parents = proto.parent;
    if (!parents) {
        // no parents = no need to resolve anything
        return deepCloneObjectUsingJson(proto) as T;
    } else if (typeof parents === 'string') {
        parents = [parents];
    }

    let res = {} as any;

    // resolve parents, construct base
    for (const parent of parents) {
        const parentProto = protoPool.find(entry => entry.type === proto.type && entry.id === parent);
        if (!parentProto) {
            logFatal({
                msg: "failed to resolve prototype inheritance: parent proto not found",
                throw: true,
                data: {
                    protoId: proto.id,
                    parentProtoType: proto.type,
                    parentProtoId: parent,
                    depth: _depth
                }
            });
            throw ''//guard
        }

        let mergeStrategyOnMap: Strategy = _depth === 0
            ? 'merge' // merge on the original 0-depth proto
            : 'preserve'; // otherwise keep first encountered value.

        let mergeStrategyOnArray: Strategy = _depth === 0
            ? 'merge' // merge on the original 0-depth proto
            : 'preserve'; // otherwise keep first encountered value.

        let mergeStrategyOnArrayResolver: ArrayOnArrayStrategyResolver | undefined = undefined;

        // entities get special treatment because of their "components" field getting merged
        // a special way, which is:
        // - duplicate components get "merged"
        // - if a merge occurs, the merge behavior for fields inside a component differs depending on whether
        // its the "surface" proto (the one for which we are resolving inheritance originally).
        // -- if its a surface proto, then any duplicates are getting replaced.
        // -- if its somewhere in the inheritance chain, then duplicate fields are discarded.
        if (proto.type === 'entity') {
            mergeStrategyOnArray = 'function_resolver';
            mergeStrategyOnArrayResolver = (key, baseCompArr, topCompArray, fallbackToStrategy) => {
                if (key !== 'components') {
                    // @ts-ignore its ok
                    return fallbackToStrategy(mergeStrategyOnArray);
                }

                for (const topComp of topCompArray) {
                    const baseComp = baseCompArr.find(comp => comp.type === topComp.type);

                    // if not a duplicate, just add it
                    if (!baseComp) {
                        baseCompArr.push(topComp);
                        continue;
                    }

                    // if duplicate, merge replacing anything duplicating inside
                    let newComp;
                    if (_depth === 0) {
                        // replace mode on surface proto
                        newComp = mergeJsonObjects(baseComp, topComp, {
                            strategyArrayOnArray: 'replace',
                            strategyMapOnMap: 'replace'
                        });
                    } else {
                        // preserve mode on parent protos
                        newComp = mergeJsonObjects(baseComp, topComp, {
                            strategyArrayOnArray: 'preserve',
                            strategyMapOnMap: 'preserve'
                        });
                    }

                    baseCompArr.push(newComp);
                }

                return baseCompArr;
            }
        }


        res = mergeJsonObjects(
            res,
            parentProto.parent
                ? resolveInheritance(parentProto, protoPool, _depth + 1)
                : parentProto, // leaf
            {
                strategyArrayOnArray: mergeStrategyOnArray,
                strategyArrayOnArrayResolver: mergeStrategyOnArrayResolver,
                strategyMapOnMap: mergeStrategyOnMap,
            }
        )
    }

    // merge with the initial proto
    res = mergeJsonObjects(res, proto);

    if (_depth === 0) {
        // always remove parent
        delete res.parent;

        // remove abstract if it was inherited
        if (res.abstract && !proto.abstract) {
            delete res.abstract;
        }
    }

    return res;
}

