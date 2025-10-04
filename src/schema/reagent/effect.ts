import { z } from 'zod';

export const effectValidator = z.looseObject({
    id: z.string(),

    conditions: z.looseObject({
        id: z.string()
    }).array().optional(),

    // ??????????
    prototype: z.string().optional(),

    reagent: z.string().optional(),

    amount: z.coerce.number().optional(),

    factor: z.coerce.number().optional(),

    damage: z.looseObject({
        // todo keys are damage types, so a predefined set of values
        // todo values are floats, can be negative for healing I guess? 
        // todo what's the difference between this and "types"
        groups: z.record(
            z.string(),
            z.string()
        ).optional(),

        // todo keys are damage types, so a predefined set of values
        // todo values are floats, can be negative for healing I guess? 
        types: z.record(
            z.string(),
            z.string()
        ).optional()
    }).optional(),

    /** Probability of a effect. */
    probability: z.coerce.number().optional(),

    /** Whether to ignore all resistances I guess? */
    ignoreResistances: z.coerce.boolean().optional(),

    /** ????? */
    scaleByQuantity: z.coerce.boolean().optional(),

    seconds: z.coerce.number().int().optional(),
});