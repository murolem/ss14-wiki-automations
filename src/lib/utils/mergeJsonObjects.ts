import { Logger } from '$logger';
import { deepCloneObjectUsingJson } from '$src/utils';
const logger = new Logger("utils/mergeJsonObjects");
const { logFatal } = logger;

export type StrategyResolver<ResValue, TopValue> =
    (
        key: string,
        resValue: ResValue,
        topValue: TopValue,
        fallbackToStrategy: (strategy: Exclude<Strategy, 'function_resolver'>) => unknown
    ) => unknown

export type ArrayOnArrayStrategyResolver = StrategyResolver<unknown[], unknown[]>;
export type MapOnMapStrategyResolver = StrategyResolver<Record<any, any>, Record<any, any>>;
// export type PrimitiveOnPrimitiveStrategyResolver = StrategyResolver<unknown, unknown>;

export type Strategy =
    // merge 2 fields
    'merge'
    // replace with top field
    | 'replace'
    // keep base field
    | 'preserve'
    // custom resolver
    | 'function_resolver';

export type Config = {
    strategyArrayOnArray: Strategy,
    strategyArrayOnArrayResolver: ArrayOnArrayStrategyResolver,

    strategyMapOnMap: Strategy,
    strategyMapOnMapResolver: MapOnMapStrategyResolver,

    strategyPrimitiveOnPrimitive: Strategy
}

type ValueTypeNarrow =
    "primitive_or_null"
    | "map"
    | "array";


const strategyTypeToType: Partial<Record<`${ValueTypeNarrow}_to_${ValueTypeNarrow}` | 'default', Strategy>> = {
    array_to_array: 'merge',
    map_to_map: 'merge',
    primitive_or_null_to_primitive_or_null: 'replace',
    default: 'replace'
}

/**
 * Merges object `topObj` with object `baseObj` recursively.
 * `JSON.stringify()` and `JSON.parse()` are used in the process, 
 * stripping all things unsupported by `JSON.stringify()`.
 * 
 * Merge follows this logic:
 * * Primitive types (string, number, etc.) are replaced.
 * * Arrays are merged.
 * * Maps are merged (following the same merge logic).
 * 
 * @param baseObj Base object.
 * @param topObj Object to merge with the base object.
 * @throws {Error} If base or top object is null.
 */
export function mergeJsonObjects(
    baseObj: object,
    topObj: object,
    config: Partial<Config> = {}
): object {
    const c = config;
    c.strategyArrayOnArray ??= 'merge';
    c.strategyMapOnMap ??= 'merge';
    c.strategyPrimitiveOnPrimitive ??= 'replace';

    if (baseObj === null || topObj === null) {
        logFatal({
            msg: "failed to merge objects: one on the objects is null",
            throw: true,
            data: {
                baseObj,
                topObj
            }
        });
        throw ''//type guard
    }

    if (c.strategyArrayOnArray === 'function_resolver' && !c.strategyArrayOnArrayResolver) {
        logFatal({
            msg: "failed to merge objects: strategy array on array set to function resolver, but no actual resolver is proved",
            throw: true,
            data: {
                baseObj,
                topObj
            }
        });
        throw ''//type guard
    } else if (c.strategyMapOnMap === 'function_resolver' && !c.strategyMapOnMapResolver) {
        logFatal({
            msg: "failed to merge objects: strategy map on map set to function resolver, but no actual resolver is proved",
            throw: true,
            data: {
                baseObj,
                topObj
            }
        });
        throw ''//type guard
    }

    const resultObj = deepCloneObjectUsingJson(baseObj) as any;
    for (const [key, value] of Object.entries(topObj)) {
        if (key in baseObj) {
            const resValue = resultObj[key];
            const resValueType = typeof resValue;

            const resValueTypeNarrow: ValueTypeNarrow = resValueType === 'object' && resValue !== null
                ? Array.isArray(resValue)
                    ? 'array'
                    : 'map'
                : 'primitive_or_null';


            const valueType = typeof value;
            const valueTypeNarrow: ValueTypeNarrow = valueType === 'object' && value !== null
                ? Array.isArray(value)
                    ? 'array'
                    : 'map'
                : 'primitive_or_null';

            let strategy = strategyTypeToType[`${resValueTypeNarrow}_to_${valueTypeNarrow}`]
                ?? strategyTypeToType.default!;

            if (resValueTypeNarrow === 'primitive_or_null' && valueTypeNarrow === 'primitive_or_null') {
                strategy = c.strategyPrimitiveOnPrimitive;
            }

            // override merge strategy on array/map types if overrides are given.
            // also ensure that if merge strat is chosen, the base/top types can merge.
            if (strategy === 'merge') {
                if (resValueTypeNarrow === 'array' && valueTypeNarrow === 'array') {
                    strategy = c.strategyArrayOnArray;
                } else if (resValueTypeNarrow === 'map' && valueTypeNarrow === 'map') {
                    strategy = c.strategyMapOnMap;
                } else {
                    logFatal({
                        msg: "failed to merge objects: merge strategy 'merge' chosen, but base and top types are unsupported for this strategy",
                        throw: true,
                        data: {
                            baseValueType: resValueType,
                            valueType,
                            baseValue: resValue,
                            value
                        }
                    });
                    throw ''//type guard 
                }
            }

            // perform the strategy
            if (strategy === 'replace') {
                resultObj[key] = value;
            } else if (strategy === 'merge') {
                // only check for base bcs the types were checked at the overrides check
                if (resValueTypeNarrow === 'array') {
                    resValue.push(...value);
                } else if (resValueTypeNarrow === 'map') {
                    resultObj[key] = mergeJsonObjects(resValue, value);
                }
            } else if (strategy === 'function_resolver') {
                // only check for base bcs the types were checked at the overrides check
                if (resValueTypeNarrow === 'array') {
                    resultObj[key] = c.strategyArrayOnArrayResolver!(
                        key,
                        resValue,
                        value,
                        strategy => mergeJsonObjects(
                            resultObj,
                            topObj,
                            {
                                ...config,
                                strategyArrayOnArray: strategy
                            }
                        )
                    );
                } else if (resValueTypeNarrow === 'map') {
                    resultObj[key] = c.strategyMapOnMapResolver!(
                        key,
                        resValue,
                        value,
                        strategy => mergeJsonObjects(
                            resultObj,
                            topObj,
                            {
                                ...config,
                                strategyMapOnMap: strategy
                            }
                        )
                    );
                }
            } else {
                // strategy = preserve; pass
            }
        } else {
            resultObj[key] = value;
        }
    }

    return resultObj;
}