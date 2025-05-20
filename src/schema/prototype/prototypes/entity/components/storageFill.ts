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
     * guh
     */
    orGroup: z.string().optional(),
    amount: z.number().optional(),
    maxAmount: z.number().optional()
})

export const storageFillEntityComponentSchema = z.object({
    type: z.literal("StorageFill"),
    contents: z.array(
        storageFillContentsEntrySchema
    )
});

