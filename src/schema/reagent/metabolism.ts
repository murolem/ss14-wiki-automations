import { effectValidator } from '$src/schema/reagent/effect';
import { z } from 'zod';

export const metabolismsValidator = z.union([
    /* for everything else */
    z.record(
        /** Metabolism category. */
        z.string(),

        /** Metabolisms - see `effects`. */
        z.looseObject({
            // todo string float
            metabolismRate: z.coerce.number().optional(),
            effects: effectValidator.array()
        })
    ),

    /* for plants */
    effectValidator.array(),
]);