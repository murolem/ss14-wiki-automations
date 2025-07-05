import { z } from 'zod';

// todo strict
export const researchDisciplineValidator = z.object({
    type: z.literal("techDiscipline"),

    id: z.string(),

    // locale key
    name: z.string(),

    // color code
    color: z.string(),

    // todo not any
    icon: z.any(),

    // % of research needed to go to this tier ?
    // keys are research levels - 1, 2 etc (string for some reason)
    // values are from 0 to 1.
    tierPrerequisites: z.record(z.string(), z.number())
})