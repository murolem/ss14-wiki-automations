import { entityComponentValidator } from '$src/schemas/entities/component';
import { z } from 'zod';

/** validator used to filter out non-entity entries. */
export const entityFilteringBasicValidator = z.object({
    type: z.literal('entity'),
});

// todo make strict if needed and remove passthrough
export const entityValidator = entityFilteringBasicValidator.extend({
    type: z.literal('entity'),

    id: z.string().optional(),

    name: z.string().optional(),

    abstract: z.boolean().optional(),

    parent: z.union([
        z.string(),
        z.string().array()
    ]).optional(),

    // components: entityComponentValidator.array().optional(),
}).passthrough();

// variation resulting from 03-processing
export const entitiyProcessedValidator = entityValidator.omit({
    id: true,
    abstract: true,
    parent: true
})