import { effectValidator } from '$src/schemas/reagent/effect';
import { z } from 'zod';

export const metabolismsValidator = z.union([
    /* for everything else */
    z.record(
        /** Metabolism category. */
        z.string(),

        /** Metabolisms - see `effects`. */
        z.object({
            // todo string float
            metabolismRate: z.number({ coerce: true }).optional(),
            effects: effectValidator.array()
        }).passthrough()
    ),

    /* for plants */
    effectValidator.array(),
]);