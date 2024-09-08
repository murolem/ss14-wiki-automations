import { entityComponentValidator } from '$src/schemas/entities/component';
import { z } from 'zod';

// todo make strict if needed
const entityComponentBase = z.object({

});

// list of knows types used for validation
// if you are adding new types to the validator below, add them here also, 
// otherwise the validator will match types not specified here with a loose type, negating your validator.
const entityComponentKnownTypes = [
    "Lathe",
    "EmagLatheRecipes"
]

const entityComponentKnownComponents = z.union([
    // todo make strict if needed
    entityComponentBase.extend({
        /** Contains items that can be made by default or need to be researched first. */
        type: z.literal("Lathe"),

        /** Item IDs of items that are available to be printed by default. */
        staticRecipes: z.array(z.string()).optional(),

        /** Item IDs of items that are available to be printed only after they have been researched. */
        dynamicRecipes: z.array(z.string()).optional(),

        materialUseMultiplier: z.number().optional(),

        timeMultiplier: z.number().optional(),

        defaultProductionAmount: z.number().optional(),

        reagentOutputSlotId: z.string().optional(),

        producingSound: z.string().optional(),
        idleState: z.string().optional(),
        runningState: z.string().optional(),
        unlitIdleState: z.string().optional(),
        unlitRunningState: z.string().optional(),
    }).strict(),

    // todo make strict if needed
    entityComponentBase.extend({
        /** Contains recipes that are available when a lathe is emagged. */
        type: z.literal("EmagLatheRecipes"),

        emagStaticRecipes: z.array(z.string()).optional(),

        emagDynamicRecipes: z.array(z.string()).optional(),
    }).strict(),
]);

const entityComponentUnknownComponents = entityComponentBase.extend({
    type: z.string().refine(val => !entityComponentKnownTypes.includes(val))
});

const entityComponent = z.union([
    entityComponentKnownComponents,
    entityComponentUnknownComponents
]);

/**
 * A validator used to distinguish entity objects.
 */
export const entityDefiningValidator = z.object({
    type: z.literal('entity'),
});

// todo make strict if needed and remove passthrough
export const entityValidator = entityDefiningValidator.extend({
    id: z.string().optional(),

    name: z.string().optional(),

    abstract: z.boolean().optional(),

    parent: z.union([
        z.string(),
        z.string().array()
    ]).optional(),

    components: entityComponent.array().optional()
}).passthrough();


// variation resulting from 03-processing
export const entitiyProcessedValidator = entityValidator.omit({
    id: true,
    abstract: true,
    parent: true
})