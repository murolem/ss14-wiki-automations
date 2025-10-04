import { type SpecificEntityComponentType, type EntityPrototype, type AnyEntityComponent, specificEntityComponentSchemaByType } from '$schemas/prototype/prototypes/entity';
import { schemaParse } from '$schemas/utils/assertSchema';
import type { StringOr } from '$utils/stringOr';
import type z from 'zod';

/**
 * Searches for a component in an entity prototype, returns match or `null`, if no such component was found.
 * @param entityProto Entity prototype to search in.
 * @param compType Component type to search for.
 */
export function tryGetComp<T extends StringOr<SpecificEntityComponentType>>(
    entityProto: EntityPrototype,
    compType: T
): AnyEntityComponent | null {
    return entityProto?.components
        ?.find(comp => comp.type === compType)
        ?? null;
}

/**
 * Searches for a component in an entity prototype.
 * - If component was found, parses it with a matching schema for given type. 
 * - If no component was found, returns `null`.
 * 
 * @param entityProto Entity prototype to search in.
 * @param compType Component type to search for.
 */
export function tryGetCompWithParse<T extends SpecificEntityComponentType>(
    entityProto: EntityPrototype,
    compType: T
): z.infer<typeof specificEntityComponentSchemaByType[T]> | null {
    const comp = entityProto?.components
        ?.find(comp => comp.type === compType);
    if (comp) {
        const schema = specificEntityComponentSchemaByType[compType];

        // @ts-ignore idk what's the issue here
        return schemaParse(schema, comp);
    } else {
        return null;
    }
}