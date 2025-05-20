import { prototypeSchema, protoIdSchema } from '$schemas/prototype/base';
import { storageFillEntityComponentSchema } from '$schemas/prototype/prototypes/entity/components/storageFill';
import { z } from 'zod';

export type CargoProductRawProtoSchema = z.infer<typeof cargoProductRawProtoSchema>;
export const cargoProductRawProtoSchema = prototypeSchema.extend({
    type: z.literal("cargoProduct"),
    icon: z.object({
        sprite: z.string(),
        state: z.union([
            z.string(),
            z.number()
        ])
    }),
    product: protoIdSchema,
    cost: z.number(),
    category: z.string(),
    group: z.string()
});

export type CargoProductProcessedProtoSchema = z.infer<typeof cargoProductProcessedProtoSchema>;
export const cargoProductProcessedProtoSchema = cargoProductRawProtoSchema.extend({
    description: z.string().optional(),
    contents: storageFillEntityComponentSchema.shape.contents.optional()
})