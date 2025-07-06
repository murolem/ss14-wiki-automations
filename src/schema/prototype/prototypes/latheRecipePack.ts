import { prototypeSchema } from '$schemas/prototype/base';
import z from 'zod';

export type LatheRecipePackProtoRawSchema = z.infer<typeof latheRecipePackProtoRawSchema>;
export const latheRecipePackProtoRawSchema = prototypeSchema.extend({
    type: z.literal('latheRecipePack'),
    recipes: z.array(z.string())
})