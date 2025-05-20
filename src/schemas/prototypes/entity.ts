import { Logger } from '$logger';
import { prototypeSchema } from '$schemas/prototype';
import { z } from 'zod';
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

export type EntityComponent = z.infer<typeof unknownComponentSchema>;
const unknownComponentSchema = z.object(({
    type: z.string()
})).passthrough();

export type EntityComponentNarrow = z.infer<typeof entityComponentSchema>;
// @ts-ignore knownComponentSchemas is zero length initially so this will error anyway
export const entityComponentSchema = z.union([
    latheComponentSchema,
    unknownComponentSchema
]);

export const entityPrototypeSchema = prototypeSchema.extend({
    components: entityComponentSchema.array().optional()
}).passthrough();