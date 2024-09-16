import { metabolismsValidator } from '$src/schemas/reagent/metabolism';
import { reactiveEffectsValidator } from '$src/schemas/reagent/reactiveEffect';
import { z } from 'zod';

export const reagentValidator = z.object({
    type: z.literal('reagent'),

    /** Reagent ID. */
    id: z.string(),

    /** Name. Looked up in the locale file. */
    name: z.string().optional(),

    /** Description. Looked up in the locale file. */
    desc: z.string().optional(),

    abstract: z.boolean().optional(),

    /** Base reagent - the one that this one extends. */
    parent: z.string().optional(),

    // viscosity: z.number({ coerce: true }).optional(),

    // // ??????
    // // todo make strict and add types
    // tileReactions: z.array(
    //     z.object({
    //         // literal
    //         id: z.string(),
    //     })
    // ).optional(),

    // group: z.string().optional(),


    // flavor: z.string().optional(),

    // flavorMinimum: z.number({ coerce: true }).optional(),

    // // always hex?
    // color: z.string().optional(),

    // // maybe optional?
    // metamorphicSprite: z.object({
    //     /** Sprite path in `Resources`. */
    //     sprite: z.string(),

    //     /** ????? */
    //     state: z.string()
    // }).strict().optional(),

    // metamorphicMaxFillLevels: z.number({ coerce: true }).int().optional(),

    // metamorphicFillBaseName: z.string().optional(),

    // metamorphicChangeColor: z.string().optional(),

    // recognizable: z.boolean({ coerce: true }).optional(),

    // /** Some other Description ??????. Looked up in the locale file. */
    // physicalDesc: z.string().optional(),

    // slippery: z.boolean({ coerce: true }).optional(),

    // /** A list of metabolisms. */
    // metabolisms: metabolismsValidator.optional(),

    // /** A list of metabolisms that only apply to plants ??????. */
    // plantMetabolism: metabolismsValidator.optional(),

    // /** Effects that apply to things when a conditions satisfies, e.g. touch. */
    // reactiveEffects: reactiveEffectsValidator.optional(),

    // // ???
    // footstepSound: z.object({
    //     // ?????
    //     collection: z.string(),

    //     // ??????
    //     params: z.object({
    //         // string int
    //         // ??????
    //         volume: z.string()
    //     })
    // }).strict().optional(),

    // boilingPoint: z.number({ coerce: true }).optional(),

    // meltingPoint: z.number({ coerce: true }).optional(),

    // // todo default is false
    // worksOnTheDead: z.boolean({ coerce: true }).optional(),

    // fizziness: z.number({ coerce: true }).optional(),

    // pricePerUnit: z.number({ coerce: true }).optional()

    // ___________: z.string(),

    // ___________: z.string(),
}).passthrough();

export type Reagent = z.infer<typeof reagentValidator>;