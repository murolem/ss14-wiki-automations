import { getPrototypes } from '$process/processors/prototypes';
import { rawPrototypeSchemasByType, type RawPrototypeSchemaType } from '$schemas/prototype';
import type { Prototype } from '$schemas/prototype/base';
import { schemaParse } from '$schemas/utils/assertSchema';
import type { StringOr } from '$utils/stringOr';
import type z from 'zod';

/** 
 * Returns prototype by given type and ID or `null` if no prototype with that type and ID combo exists.
 */
export function tryGetProtoById(
    type: StringOr<RawPrototypeSchemaType>,
    id: string,
): Prototype | null {
    const proto = getPrototypes()
        .find(proto => proto.type === type && proto.id === id);
    return proto ?? null;
}

/** 
 * Returns prototype by given type and ID or `null` if no prototype with that type and ID combo exists.
 * 
 * If prototype is found, passes it through a matching schema.
 */
export function tryGetProtoByIdWithParse<T extends RawPrototypeSchemaType>(
    type: T,
    id: string
): z.infer<typeof rawPrototypeSchemasByType[T]> | null {
    const proto = tryGetProtoById(type, id);
    if (proto) {
        const schema = rawPrototypeSchemasByType[type];

        return schemaParse(schema, proto);
    } else {
        return null;
    }
}

/**
 * Filters prototypes by type.
 * 
 * @param type Type to filter prototypes.
 */
export function filterProtosByType(type: StringOr<RawPrototypeSchemaType>): Prototype[] {
    return getPrototypes()
        .filter(proto => proto.type === type);
}

/** 
 * Filter prototypes by type and parses each to a known schema.
 * 
 * A schema must be defined for a prototype type.
*/
export function filterProtosByTypeWithParse<T extends RawPrototypeSchemaType>(
    type: T
): Array<z.infer<typeof rawPrototypeSchemasByType[T]>> {
    const schema = rawPrototypeSchemasByType[type as RawPrototypeSchemaType];

    return getPrototypes()
        .filter(proto => proto.type === type)
        .map(proto => schemaParse(schema, proto));
}