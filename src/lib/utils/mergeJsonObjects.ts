import { Logger } from '$logger';
import { deepCloneObjectUsingJson } from '$src/utils';
const logger = new Logger("utils/mergeJsonObjects");
const { logFatal } = logger;

type StrategyResolver<BaseValue, TopValue> =
    (key: string, baseValue: BaseValue, topValue: TopValue) => unknown

export type ArrayOnArrayStrategyResolver = StrategyResolver<unknown[], unknown[]>;
export type MapOnMapStrategyResolver = StrategyResolver<Record<any, any>, Record<any, any>>;

export type Config = {
    strategyArrayOnArray:
    Exclude<Strategy, 'function_resolver'>
    | ArrayOnArrayStrategyResolver,

    strategyMapOnMap:
    Exclude<Strategy, 'function_resolver'>
    | MapOnMapStrategyResolver
}

type ValueTypeNarrow =
    "primitive_or_null"
    | "map"
    | "array";

type Strategy =
    // merge 2 fields
    'merge'
    // replace with top field
    | 'replace'
    // keep base field
    | 'preserve'
    // custom resolver
    | 'function_resolver';

const strategyTypeToType: Partial<Record<`${ValueTypeNarrow}_to_${ValueTypeNarrow}` | 'default', Strategy>> = {
    array_to_array: 'merge',
    map_to_map: 'merge',
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
    {
        strategyArrayOnArray = 'merge',
        strategyMapOnMap = 'merge'
    }: Partial<Config> = {}
): object {
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

    const resultObj = deepCloneObjectUsingJson(baseObj) as any;
    for (const [key, value] of Object.entries(topObj)) {
        if (key in baseObj) {
            const baseValue = resultObj[key];
            const baseValueType = typeof baseValue;

            const baseValueTypeNarrow: ValueTypeNarrow = baseValueType === 'object' && baseValue !== null
                ? Array.isArray(baseValue)
                    ? 'array'
                    : 'map'
                : 'primitive_or_null';


            const valueType = typeof value;
            const valueTypeNarrow: ValueTypeNarrow = valueType === 'object' && value !== null
                ? Array.isArray(value)
                    ? 'array'
                    : 'map'
                : 'primitive_or_null';

            let strategy = strategyTypeToType[`${baseValueTypeNarrow}_to_${valueTypeNarrow}`]
                ?? strategyTypeToType.default!;

            // override merge strategy on array/map types if overrides are given.
            // also ensure that if merge strat is chosen, the base/top types can merge.
            if (strategy === 'merge') {
                if (baseValueTypeNarrow === 'array' && valueTypeNarrow === 'array') {
                    // @ts-ignore idk
                    strategy = typeof strategyArrayOnArray === 'function'
                        ? 'function_resolver'
                        : strategyArrayOnArray;
                } else if (baseValueTypeNarrow === 'map' && valueTypeNarrow === 'map') {
                    // @ts-ignore idk
                    strategy = typeof strategyMapOnMap === 'function'
                        ? 'function_resolver'
                        : strategyMapOnMap;
                } else {
                    logFatal({
                        msg: "failed to merge objects: merge strategy 'merge' chosen, but base and top types are unsupported for this strategy",
                        throw: true,
                        data: {
                            baseValueType,
                            valueType,
                            baseValue,
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
                if (baseValueTypeNarrow === 'array') {
                    baseValue.push(...value);
                } else if (baseValueTypeNarrow === 'map') {
                    resultObj[key] = mergeJsonObjects(baseValue, value);
                }
            } else if (strategy === 'function_resolver') {
                // only check for base bcs the types were checked at the overrides check
                if (baseValueTypeNarrow === 'array') {
                    resultObj[key] = (strategyArrayOnArray as ArrayOnArrayStrategyResolver)(key, baseValue, value);
                } else if (baseValueTypeNarrow === 'map') {
                    resultObj[key] = (strategyMapOnMap as ArrayOnArrayStrategyResolver)(key, baseValue, value);
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