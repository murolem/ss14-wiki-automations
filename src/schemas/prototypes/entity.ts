import { Logger } from '$logger';
import { prototypeSchema } from '$schemas/prototype';
import { z } from 'zod';
const logger = new Logger("schemas/proto/entity");
const { logInfo, logFatal } = logger;

const componentTypes: string[] = [];
const knownComponentSchemas: z.ZodTypeAny[] = [];

function registerComponentSchema(type: string, getSchema: (type: string) => z.ZodTypeAny): void {
    if (componentTypes.includes(type)) {
        logFatal({
            msg: `faled to register a schema: schema for type '$type}' already registered`,
            throw: true
        });
    }

    componentTypes.push(type);
    knownComponentSchemas.push(getSchema(type));
}

// ===========================

/** Contains items that can be made by default or need to be researched first. */
registerComponentSchema('Lathe', type => z.object({
    type: z.literal(type),

    /** Recipe pack IDs of items that are available to be printed by default. */
    staticPacks: z.array(z.string()).optional(),

    /** Recipe pack IDs of items that are available to be printed only after they have been researched. */
    dynamicPacks: z.array(z.string()).optional(),

    materialUseMultiplier: z.number().optional(),

    timeMultiplier: z.number().optional(),

    defaultProductionAmount: z.number().optional()
}));

// ===========================

const unknownComponentSchema = z.object(({
    type: z.string().refine(type => !componentTypes.includes(type))
})).passthrough();

// @ts-ignore knownComponentSchemas is zero length initially so this will error anyway
const componentSchema = z.union([
    ...knownComponentSchemas,
    unknownComponentSchema
]);

export const entityPrototypeSchema = prototypeSchema.extend({
    components: componentSchema.array().optional()
}).passthrough();