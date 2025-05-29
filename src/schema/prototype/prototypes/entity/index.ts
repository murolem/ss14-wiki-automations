import { Logger } from '$logger';
import { prototypeSchema } from '$schemas/prototype/base';
import { entityTableContainerFillEntityComponentSchema } from '$schemas/prototype/prototypes/entity/components/entityTableContainerFill';
import { storageFillEntityComponentSchema } from '$schemas/prototype/prototypes/entity/components/storageFill';
import { z, ZodType } from 'zod';
const logger = new Logger("schemas/proto/entity");
const { logInfo, logFatal } = logger;

// ===========================

/** Contains items that can be made by default or need to be researched first. */
const latheComponentSchema = z.object({
    type: z.literal("Lathe"),

    /** Recipe pack IDs of items that are available to be printed by default. */
    staticPacks: z.array(z.string()).optional(),

    /** Recipe pack IDs of items that are available to be printed only after they have been researched. */
    dynamicPacks: z.array(z.string()).optional(),

    materialUseMultiplier: z.number().optional(),

    timeMultiplier: z.number().optional(),

    defaultProductionAmount: z.number().optional()
})

// ===========================

export type EntityComponent = z.infer<typeof unknownEntityComponentSchema>;
const unknownEntityComponentSchema = z.object(({
    type: z.string()
})).passthrough();


export type KnownEntityComponent = z.infer<typeof knownEntityComponentSchema>;
export type KnownEntityComponentType = KnownEntityComponent['type'];

// !this one should be equal to the second one
/** A map of component type to schema. */
export const entityComponentSchemaByType = {
    StorageFill: storageFillEntityComponentSchema,
    EntityTableContainerFill: entityTableContainerFillEntityComponentSchema,
    Lathe: latheComponentSchema
} satisfies Record<string, ZodType>;

// !this is the second one and it should be equal to the first one
/** Entity component schema for components for whom a schema is defined. */
export const knownEntityComponentSchema = z.union([
    entityComponentSchemaByType.Lathe,
    entityComponentSchemaByType.EntityTableContainerFill,
    entityComponentSchemaByType.StorageFill,
])

/** Entity component schema matching any entity. */
export const entityComponentSchema = z.union([
    knownEntityComponentSchema,
    unknownEntityComponentSchema
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

export const entityWikiMapOfIdToName = z.record(z.string(), z.string());
export const entityWikiMapOfLcNameToId = z.record(z.string(), z.string());