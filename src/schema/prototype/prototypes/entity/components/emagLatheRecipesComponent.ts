import { protoIdSchema } from '$schemas/prototype/base';
import z from 'zod';

/** Contains items that can be made by default or need to be researched first. */
export const emagLatheRecipesComponentSchema = z.object({
    type: z.literal("EmagLatheRecipes"),

    /** Recipe pack IDs of items that are available to be printed by default when the lathe is EMAGged. */
    emagStaticPacks: z.array(protoIdSchema).optional(),

    /** Recipe pack IDs of items that are available to be printed only after they have been researched and the lathe is EMAGged. */
    emagDynamicPacks: z.array(protoIdSchema).optional(),
})