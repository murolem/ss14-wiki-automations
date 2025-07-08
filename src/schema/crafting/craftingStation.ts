import { protoIdSchema } from '$schemas/prototype/base';
import z from 'zod';

export const wikiSchemaCraftingStationConfigBase = z.object({
    stationType: z.string()
});

export const wikiSchemaLatheConfig = wikiSchemaCraftingStationConfigBase.extend({
    stationType: z.literal("Lathe"),

    id: protoIdSchema,

    /** Recipe IDs of items that are available to be printed by default. */
    staticRecipes: z.array(z.string()).optional(),

    /** Recipe IDs of items that are available to be printed only after they have been researched. */
    dynamicRecipes: z.array(z.string()).optional(),

    materialUseMultiplier: z.number().optional(),

    timeMultiplier: z.number().optional(),

    defaultProductionAmount: z.number().optional()
});

// will be a union with 2 or more configs
export const wikiSchemaCraftingStationConfig = wikiSchemaLatheConfig;