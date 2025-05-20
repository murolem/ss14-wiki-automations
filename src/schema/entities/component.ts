import { z } from 'zod';

// todo make strict if needed
export const entityComponentValidator = z.object({
    type: z.string()
})