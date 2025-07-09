import { protoIdSchema } from '$schemas/prototype/base';
import z from 'zod';

export const wikiSchemaCraftingStationConfigBase = z.object({
    stationType: z.string()
});

export const wikiSchemaLatheConfig = wikiSchemaCraftingStationConfigBase.extend({
    stationType: z.literal("Lathe"),

    id: protoIdSchema,

    /** Recipe IDs of items that are available to be printed by default. */
    staticRecipes: z.array(protoIdSchema).optional(),

    /** Recipe IDs of items that are available to be printed only after they have been researched. */
    dynamicRecipes: z.array(protoIdSchema).optional(),

    /** Recipe IDs of items that are available to be printed by default when the lathe is EMAGged. */
    emagStaticRecipes: z.array(protoIdSchema).optional(),

    /** Recipe IDs of items that are available to be printed only after they have been researched and the lathe is EMAGged. */
    emagDynamicRecipes: z.array(protoIdSchema).optional(),

    materialUseMultiplier: z.number().optional(),

    timeMultiplier: z.number().optional(),

    defaultProductionAmount: z.number().optional()
}).strict();

// will be a union with 2 or more configs
export const wikiSchemaCraftingStationConfig = wikiSchemaLatheConfig;