import { vector2iSchema } from '$schemas/core/vector2i';
import { yamlTypeFieldName } from '$schemas/core/yamlSchema';
import { protoIdSchema } from '$schemas/prototype/base';
import { schemaParse } from '$schemas/utils/assertSchema';
import { z } from 'zod';

// = number selector =

/** Picks a value based on a Binomial Distribution of N Trials given P Chance. */
const binomialNumberSelectorSchema = z.object({
    [yamlTypeFieldName]: z.literal("BinomialNumberSelector"),

    /** How many times to try including an entry. i.e. the Max. */
    trials: z.number().int().default(1),

    /** The odds a single trial succeeds. */
    chance: z.number().default(.5),
});

/** Gives a constant value. */
const constantNumberSelectorSchema = z.object({
    [yamlTypeFieldName]: z.literal("ConstantNumberSelector"),

    value: z.number().default(1)
});

/** Gives a value between the two numbers specified, inclusive. */
const rangeNumberSelectorSchema = z.object({
    [yamlTypeFieldName]: z.literal("RangeNumberSelector"),

    range: vector2iSchema.default("1, 1")
});

/** A union of all number selectors. */
const numberSelectorSchema = z.union([
    binomialNumberSelectorSchema,
    constantNumberSelectorSchema,
    rangeNumberSelectorSchema
])

// ===============
// = table selectors =

const entityTableConditionSchema = z.object({
    /** If true, inverts the result of the condition. */
    invert: z.boolean()
});

const entitySelectorSchema = z.object({
    /** The number of times this selector is run */
    rolls: z.number().int().default(1),

    /** A weight used to pick between selectors. */
    weight: z.number().default(1),

    /** A simple chance that the selector will run. */
    prob: z.number().default(1),

    /** A list of conditions that must evaluate to 'true' for the selector to apply. */
    conditions: z.array(entityTableConditionSchema).default([]),

    /**
     * If true, all the conditions must be successful in order for the selector to process.
     * Otherwise, only one of them must be.
     */
    requireAll: z.boolean().default(true),
});

type AllSelector = z.infer<typeof entitySelectorSchema> & {
    [yamlTypeFieldName]: "AllSelector",

    children: Array<z.infer<typeof entityTableSelectorSchema>>
}

/** Gets spawns from all of the child selectors. */
// @ts-ignore head hurts
const allSelectorSchema: z.ZodType<AllSelector> = entitySelectorSchema.extend({
    [yamlTypeFieldName]: z.literal("AllSelector"),

    children: z.lazy(() => z.array(entityTableSelectorSchema))
});

/** Gets the spawn for the entity prototype specified at whatever count specified. */
const entSelector = entitySelectorSchema.extend({
    // optional because its type could be inferred,
    // see https://github.com/space-wizards/space-station-14/blob/fdbf2a229ec0b462eb1ea51cd2f00e64d8536ab3/Content.Shared/EntityTable/EntitySelectors/EntityTableTypeSerializer.cs#L33
    [yamlTypeFieldName]: z.literal("EntSelector").optional(),

    id: protoIdSchema,

    amount: numberSelectorSchema.default(
        schemaParse(constantNumberSelectorSchema, {
            [yamlTypeFieldName]: "ConstantNumberSelector",
            value: 1
        })
    )
});

type GroupSelector = z.infer<typeof entitySelectorSchema> & {
    [yamlTypeFieldName]: "GroupSelector",

    children: Array<z.infer<typeof entityTableSelectorSchema>>
}

/** Gets the spawns from one of the child selectors, based on the weight of the children */
// @ts-ignore head hurts
const groupSelectorSchema: z.ZodType<GroupSelector> = entitySelectorSchema.extend({
    [yamlTypeFieldName]: z.literal("GroupSelector"),

    children: z.lazy(() => z.array(entityTableSelectorSchema))
})

/**
 * Gets the spawns from the entity table prototype specified.
 * Can be used to reuse common tables.
 */
const nestedSelectorSchema = entitySelectorSchema.extend({
    [yamlTypeFieldName]: z.literal("NestedSelector"),

    tableId: protoIdSchema
});

/** Selects nothing. */
const noneSelectorSchema = entitySelectorSchema.extend({
    [yamlTypeFieldName]: z.literal("NoneSelector"),
});

/** A union of all entity table selectors. */
const entityTableSelectorSchema = z.union([
    entitySelectorSchema,
    allSelectorSchema,
    entSelector,
    groupSelectorSchema,
    nestedSelectorSchema,
    noneSelectorSchema
])

// =============

/** `EntityTableContainerFill` entity component. */
export const entityTableContainerFillEntComponentSchema = z.object({
    type: z.literal("EntityTableContainerFill"),
    containers: z.record(z.string(), entityTableSelectorSchema)
});
