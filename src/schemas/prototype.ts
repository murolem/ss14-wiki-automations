import { z } from 'zod';

/** Basic prototype schema. Passthrough. */
export type Prototype = z.infer<typeof prototypeSchema>;
export const prototypeSchema = z.object({
    id: z.string({ coerce: true }),
    type: z.string()
}).passthrough();

export const prototypeArraySchema = prototypeSchema.array();