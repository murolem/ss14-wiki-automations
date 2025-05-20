import { protoIdSchema } from '$schemas/prototype';
import { z } from 'zod';

const entitySpawnEntrySchema = z.object({
    id: protoIdSchema,
    prob: z.number().optional(),
    orGroup: z.string().optional(),
    amount: z.number().optional(),
    maxAmount: z.number().optional()
})

export const storageFillEntityComponentSchema = z.object({
    type: z.literal("StorageFill"),
    contents: z.array(
        entitySpawnEntrySchema
    )
});

