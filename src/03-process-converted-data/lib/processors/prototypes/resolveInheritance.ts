import { deepCloneObjectUsingJson } from '$src/utils';
import { Logger } from '$logger';
const logger = new Logger("schemas/utils");
const { logInfo, logFatal } = logger;
import type { Prototype } from '$schemas/prototype';
import { mergeJsonObjects } from '$utils/mergeJsonObjects';

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

        if (parentProto.parent) {
            res = mergeJsonObjects(
                res,
                resolveInheritance(parentProto, protoPool, _depth + 1)
            )
        } else {
            // leaf
            res = mergeJsonObjects(
                res,
                parentProto
            );
        }
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