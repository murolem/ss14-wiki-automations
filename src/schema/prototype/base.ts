import { z } from 'zod';

export type ProtoId = z.infer<typeof protoIdSchema>;
export const protoIdSchema = z.string({ coerce: true })

/** Basic prototype schema. Passthrough. */
export type Prototype = z.infer<typeof prototypeSchema>;
export const prototypeSchema = z.object({
    id: protoIdSchema,
    type: z.string(),
    parent: z.union([
        z.string(),
        z.string().array()
    ]).optional(),
    abstract: z.boolean().optional(),
}).passthrough();

export const prototypeArraySchema = prototypeSchema.array();