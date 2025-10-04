import { z } from 'zod';

export type ProtoId = z.infer<typeof protoIdSchema>;
export const protoIdSchema = z.coerce.string();

export type ProtoType = z.infer<typeof protoTypeSchema>;
export const protoTypeSchema = z.string();

/** Basic prototype schema. Passthrough. */
export type Prototype = z.infer<typeof prototypeSchema>;
export const prototypeSchema = z.looseObject({
    id: protoIdSchema,
    type: protoTypeSchema,
    parent: z.union([
        z.string(),
        z.string().array()
    ]).optional(),
    abstract: z.boolean().optional(),
});

export const prototypeArraySchema = prototypeSchema.array();