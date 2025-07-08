import { Logger } from '$logger';
import { prototypeSchema } from '$schemas/prototype/base';
import { entityTableContainerFillEntComponentSchema } from '$schemas/prototype/prototypes/entity/components/entityTableContainerFill';
import { latheEntComponentSchema } from '$schemas/prototype/prototypes/entity/components/latheComponent';
import { storageFillEntComponentSchema } from '$schemas/prototype/prototypes/entity/components/storageFill';
import { z, ZodType } from 'zod';
const logger = new Logger("schemas/proto/entity");
const { logInfo, logFatal } = logger;

export type AnyEntityComponent = z.infer<typeof anyEntityComponentSchema>;
const anyEntityComponentSchema = z.object(({
    type: z.string()
})).passthrough();


export type SpecificEntityComponent = z.infer<typeof specificEntityComponentSchema>;
export type SpecificEntityComponentType = SpecificEntityComponent['type'];

// !this one should be equal to the second one
/** A map of component type to schema. */
export const specificEntityComponentSchemaByType = {
    StorageFill: storageFillEntComponentSchema,
    EntityTableContainerFill: entityTableContainerFillEntComponentSchema,
    Lathe: latheEntComponentSchema
} satisfies Record<string, ZodType>;

// !this is the second one and it should be equal to the first one
/** Entity component schema for components for whom a schema is defined. */
export const specificEntityComponentSchema = z.union([
    specificEntityComponentSchemaByType.Lathe,
    specificEntityComponentSchemaByType.EntityTableContainerFill,
    specificEntityComponentSchemaByType.StorageFill,
])

/** Entity component schema matching any entity. */
export const entityComponentSchema = z.union([
    specificEntityComponentSchema,
    anyEntityComponentSchema
]);

export type EntityPrototype = z.infer<typeof entityPrototypeSchema>;
export const entityPrototypeSchema = prototypeSchema.extend({
    name: z.string().optional(),

    description: z.union([
        z.string(),
        z.null()
    ]).optional(),

    components: entityComponentSchema.array().optional()
});

export const wikiSchemaEntityMapOfIdToName = z.record(z.string(), z.string());
export const wikiSchemaEntityMapOfLcNameToId = z.record(z.string(), z.string());