import { z } from 'zod';

export const researchTechValidator = z.object({
    type: z.literal("technology"),

    // research ID
    id: z.string(),

    // locale key
    name: z.string(),


    // todo any
    icon: z.any(),

    // research "category"
    // todo category colors
    discipline: z.string(),

    // 1, 2, etc.
    tier: z.number(),

    // cost in research points
    cost: z.number(),

    /** ids of recipes this research unlocks */
    recipeUnlocks: z.string().array(),

    /** ids of techs needed for this tech to be unlockable */
    technologyPrerequisites: z.string().array().optional()
}).strict();