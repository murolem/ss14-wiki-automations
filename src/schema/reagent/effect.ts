import { z } from 'zod';

export const effectValidator = z.object({
    id: z.string(),

    conditions: z.object({
        id: z.string()
    }).passthrough().array().optional(),

    // ??????????
    prototype: z.string().optional(),

    reagent: z.string().optional(),

    amount: z.number({ coerce: true }).optional(),

    factor: z.number({ coerce: true }).optional(),

    damage: z.object({
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
    }).passthrough().optional(),

    /** Probability of a effect. */
    probability: z.number({ coerce: true }).optional(),

    /** Whether to ignore all resistances I guess? */
    ignoreResistances: z.boolean({ coerce: true }).optional(),

    /** ????? */
    scaleByQuantity: z.boolean({ coerce: true }).optional(),

    seconds: z.number({ coerce: true }).int().optional(),
}).passthrough();