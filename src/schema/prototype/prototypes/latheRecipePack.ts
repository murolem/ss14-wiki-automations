import { prototypeSchema } from '$schemas/prototype/base';
import z from 'zod';

export type LatheRecipePackProtoSchema = z.infer<typeof latheRecipePackProtoSchema>;
export const latheRecipePackProtoSchema = prototypeSchema.extend({
    type: z.literal('latheRecipePack'),
    recipes: z.array(z.string())
})