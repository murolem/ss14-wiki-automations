import { deepCloneObjectUsingJson } from '$src/utils';
import { Logger } from '$logger';
const logger = new Logger("schemas/utils");
const { logInfo, logFatal } = logger;
import { mergeJsonObjects, type ArrayOnArrayStrategyResolver, type Config as MergeJsonConfig } from '$utils/mergeJsonObjects';
import chalk from 'chalk';
import type { EntityComponent } from '$schemas/prototype/prototypes/entity';
import type { ProtoType, ProtoId, Prototype } from '$schemas/prototype/base';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';

const mergeJsonConfigParentProtos: Partial<MergeJsonConfig> = {
    strategyArrayOnArray: 'preserve',
    strategyMapOnMap: 'preserve',
    strategyPrimitiveOnPrimitive: 'preserve'
}

const mergeJsonConfigOriginalProto: Partial<MergeJsonConfig> = {
    strategyArrayOnArray: 'replace',
    strategyMapOnMap: 'replace',
    strategyPrimitiveOnPrimitive: 'replace'
}

const mergeJsonConfigsByProtoType: Record<
    string,
    { parentProtos: Partial<MergeJsonConfig>, originalProto: Partial<MergeJsonConfig> }
> = {
    entity: {
        parentProtos: {
            ...mergeJsonConfigParentProtos,
            strategyArrayOnArray: 'function_resolver',
            strategyArrayOnArrayResolver: getEntityMergeStrategyOnArrayResolver(1)
        },
        originalProto: {
            ...mergeJsonConfigOriginalProto,
            strategyArrayOnArray: 'function_resolver',
            strategyArrayOnArrayResolver: getEntityMergeStrategyOnArrayResolver(0)
        }
    }
}

export type ProtoPool = Record<ProtoType, Record<ProtoId, Prototype>>

export function createProtoPool(protos: Prototype[]) {
    const pool: ProtoPool = {};

    for (const proto of protos) {
        let protosByType = getObjPropOrCreate(pool, proto.type, () => ({}));
        protosByType[proto.id] = proto;
    }

    return pool;
}

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
 * @returns A new prototype with resolved inheritance.
 */
export function resolveInheritance(
    proto: Prototype,
    protoPool: ProtoPool
): Prototype {
    let parents = proto.parent;
    if (!parents) {
        // no parents = no need to resolve anything
        return deepCloneObjectUsingJson(proto) as Prototype;
    } else if (typeof parents === 'string') {
        parents = [parents];
    }

    /** Chain of prototypes in order of inheritance, with original proto closing the chain. */
    const protoChain = [
        ...getParentPrototypesRecursive(proto, protoPool),
        proto
    ];

    let res = {} as any;
    const mergeConfigByProtoType = mergeJsonConfigsByProtoType[proto.type];

    for (const [i, chainProto] of protoChain.entries()) {
        // final proto = original proto
        const isFinalProto = i === protoChain.length - 1;

        let mergeConfig: Partial<MergeJsonConfig>;
        if (isFinalProto) {
            mergeConfig = mergeConfigByProtoType
                ? mergeConfigByProtoType.originalProto
                : mergeJsonConfigOriginalProto;
        } else {
            mergeConfig = mergeConfigByProtoType
                ? mergeConfigByProtoType.parentProtos
                : mergeJsonConfigParentProtos;
        }

        res = mergeJsonObjects(res, chainProto, mergeConfig);
    }

    // cleanup

    // always remove parent
    delete res.parent;

    // remove abstract if it was inherited
    if (res.abstract && !proto.abstract) {
        delete res.abstract;
    }

    return res;
}

/** 
 * Constructs a tree of parent prototypes.
 * Returns an array of "final" parents, from left to right.
 * */
function getParentPrototypesRecursive(
    proto: Prototype,
    protoPool: ProtoPool
): Prototype[] {
    if (!proto.parent) {
        // no further parents = we are done
        return [];
    }

    const parentProtoIds = typeof proto.parent === 'string'
        ? [proto.parent]
        : proto.parent;

    const parentProtos: Prototype[] = [];
    for (const parentProtoId of parentProtoIds) {
        const parentProto = protoPool[proto.type]?.[parentProtoId];

        if (!parentProto) {
            logFatal({
                msg: `failed to get parent prototypes recursively: encountered a non-existent parent proto ID: ${chalk.bold(parentProtoId)}`,
                throw: true,
            });
            throw ''//guard
        }

        // current parent
        parentProtos.push(parentProto);

        // does the parent has more parents?
        if (parentProto.parent) {
            parentProtos.push(...getParentPrototypesRecursive(parentProto, protoPool));
        }
    }

    return parentProtos;
}

function getEntityMergeStrategyOnArrayResolver(depth: number): ArrayOnArrayStrategyResolver {
    return function (key, resCompArr, topCompArray, fallbackToStrategy) {
        if (key !== 'components') {
            return fallbackToStrategy(depth === 0 ? 'replace' : 'preserve');
        }

        for (const topComp of topCompArray) {
            const compType = (topComp as EntityComponent).type;

            const resComp = (resCompArr as EntityComponent[])
                .find(comp => (comp as EntityComponent).type === compType);

            // if not a duplicate, just add it
            if (!resComp) {
                resCompArr.push(topComp);
                continue;
            }

            // if duplicate, merge replacing anything duplicating inside
            resCompArr[resCompArr.indexOf(resComp)] =
                mergeJsonObjects(
                    resComp,
                    topComp as EntityComponent,
                    // replace mode on surface proto, preserve mode on parent protos
                    depth === 0 ? mergeJsonConfigOriginalProto : mergeJsonConfigParentProtos

                );
        }

        return resCompArr;
    }
}