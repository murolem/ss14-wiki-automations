import { protoIdSchema } from '$schemas/prototype/base';
import { z } from 'zod';

const storageFillContentsEntrySchema = z.object({
    id: protoIdSchema,

    /** 
     * Probability of this item spawning.
     * 
     * Changes meaning when used with {@link orGroup} - see it for details.
     */
    prob: z.number().optional(),

    /**
     * Group for this entry. Grouped entities' probabilities act as weights, guaranteeing
     * that one of them will roll.
     */
    orGroup: z.string().optional(),

    /** Amount. */
    amount: z.number().optional(),

    /** Max amount. If specified, creates a range with a random distribution instead 
     * - between {@link amount} and this. */
    maxAmount: z.number().optional()
})

export const storageFillEntComponentSchema = z.object({
    type: z.literal("StorageFill"),
    contents: z.array(
        storageFillContentsEntrySchema
    )
});

