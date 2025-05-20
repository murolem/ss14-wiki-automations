import { protoIdSchema, prototypeArraySchema, protoTypeSchema, prototypeSchema, type ProtoId, type ProtoType, type Prototype } from '$schemas/prototype/base';
import { cargoProductRawProtoSchema, cargoProductProcessedProtoSchema } from '$schemas/prototype/prototypes/cargoProduct';
import { entityPrototypeSchema } from '$schemas/prototype/prototypes/entity';
import { z, ZodType } from 'zod';

/** "Raw" prototype types with defined schemas. */
export type RawPrototypeSchemaType = keyof typeof rawPrototypeSchemasByType;

/** 
 * A map of prototype types to their schemas.
 * This one covers "raw" prototypes that are found in the game files.
 */
export const rawPrototypeSchemasByType = {
    entity: entityPrototypeSchema,
    cargoProduct: cargoProductRawProtoSchema
} satisfies Record<string, ZodType>;

/** 
 * A map of prototype types to their schemas.
 * This one covers "processed" prototypes that come out after the processing step.
 */
export const processedPrototypeSchemasByType = {
    cargoProduct: cargoProductProcessedProtoSchema
} satisfies Record<string, ZodType>;