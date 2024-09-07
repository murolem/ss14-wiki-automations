import { z } from 'zod';

export const latheRecipeValidator = z.object({
    /** The unique type for lathe recipes. */
    type: z.literal("latheRecipe"),

    /** 
     * On what condition this recipe is available.
     */
    availability: z.union([
        z.literal('static'),
        z.literal('dynamic'),
        z.literal('emag static'),
        z.literal('emag dynamic'),
    ]).optional(),

    /** Whether this recipe is used only as parent for inheritance. */
    abstract: z.boolean().optional(),

    /** Parent recipe the current one is based upon. */
    parent: z.string().optional(),

    /** Recipe ID. */
    id: z.string(),

    /** Recipe name (to be localized). */
    name: z.string().optional(),

    /** Recipe category. */
    // todo lathe recipe category literal
    category: z.string().optional(),

    /** Resulting item ID. */
    result: z.string().optional(),

    /** Duration in seconds. */
    completetime: z.number().optional(),

    // todo
    applyMaterialDiscount: z.boolean({ coerce: true }).optional(),

    /** Recipe icon (?). */
    icon: z.object({
        /** Path to the sprite from Texturses. */
        sprite: z.string(),

        /** Icon state (?). Maybe literal. */
        state: z.string()
    }).strict().optional(),

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
}).strict();

// export const latheRecipeValidatorAfterProcessing = latheRecipeValidator.omit({
//     type: true,
//     result: true
// })

// export const latheRecipeAfterParseValidator = z.record(
//     // recipe ID
//     z.string(),
//     latheRecipeValidator
//         .omit({ id: true })
//         // normalize recipe costs
//         .transform((latheRecipe => {
//             Object.entries(latheRecipe.materials)
//                 .forEach(([material, count]) => {
//                     latheRecipe.materials[material] = count / 100;
//                 });

//             return latheRecipe;
//         }))
// );

export const latheCategoryValidator = z.object({
    /** The unique type for lathe categories. */
    type: z.literal("latheCategory"),

    /** Category ID. */
    id: z.string(),

    /** Category name (to be localized). */
    name: z.string()
}).strict();