import { prototypeSchema } from '$schemas/prototype/base';
import { z } from 'zod';

export type LatheRecipeProtoSchema = z.infer<typeof latheRecipeProtoSchema>;
export const latheRecipeProtoSchema = prototypeSchema.extend({
    /** The unique type for lathe recipes. */
    type: z.literal("latheRecipe"),

    // /** 
    //  * On what condition this recipe is available.
    //  */
    // availability: z.union([
    //     z.literal('static'),
    //     z.literal('dynamic'),
    //     z.literal('emag static'),
    //     z.literal('emag dynamic'),
    // ]).optional(),

    /** Recipe name (to be localized). */
    name: z.string().optional(),

    /** Recipe category. */
    // todo lathe recipe category literal
    category: z.string().optional(),

    /** Resulting item ID. */
    result: z.string().optional(),

    /** 
     * Resulting reagents for lathes that product reagents.
     * Mapping reagent ID to amount.
     */
    resultReagents: z.record(z.string(), z.number()).optional(),

    /** Duration in seconds. */
    completetime: z.number().optional(),

    // todo
    applyMaterialDiscount: z.coerce.boolean().optional(),

    /** Recipe icon (?). */
    icon: z.object({
        /** Path to the sprite from Texturses. */
        sprite: z.string(),

        /** Icon state (?). Maybe literal. */
        state: z.string()
    }).optional(),

    /** 
     * The recipe. 
     * 
     * - Keys are item IDs. 
     * - Values are amount of material required multiplied by 100. 
     * So if something requires 2.25 steel to make, it's gonna be written as 225 steel. */
    materials: z.record(
        z.string(),
        z.number()
    ).optional()
});

// export type CargoProductProcessedProtoSchema = z.infer<typeof cargoProductProcessedProtoSchema>;
// export const cargoProductProcessedProtoSchema = cargoProductRawProtoSchema.extend({
//     description: z.string().optional(),
//     contents: storageFillEntityComponentSchema.shape.contents.optional()
// })

export const wikiSchemaRecipeMapOfRecipeIdToRecipe = z.record(
    z.string(),
    latheRecipeProtoSchema
);

export const wikiSchemaRecipeMapOfRecipeProductToRecipeId = z.record(
    z.string(),
    z.union([
        z.string(),
        // if a product has multiple recipes
        z.string().array()
    ])
);

export const wikiSchemaRecipeMapOfRecipeMethodToAvailabilityToToRecipeIds = z.record(
    z.string(),
    z.record(
        z.string(),
        z.string().array()
    )
);