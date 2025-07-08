import z from 'zod';

/** Contains items that can be made by default or need to be researched first. */
export const latheEntComponentSchema = z.object({
    type: z.literal("Lathe"),

    /** Recipe pack IDs of items that are available to be printed by default. */
    staticPacks: z.array(z.string()).optional(),

    /** Recipe pack IDs of items that are available to be printed only after they have been researched. */
    dynamicPacks: z.array(z.string()).optional(),

    materialUseMultiplier: z.number().optional(),

    timeMultiplier: z.number().optional(),

    defaultProductionAmount: z.number().optional()
})