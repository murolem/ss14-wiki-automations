import { effectValidator } from '$src/schema/reagent/effect';
import { z } from 'zod';

export const reactiveEffectsValidator = z.record(
    /** Effect category. */
    z.string(),

    /** Metabolisms - see `effects`. */
    z.looseObject({
        // todo convert to literal
        methods: z.string().array(),

        effects: effectValidator.array()
    })
);