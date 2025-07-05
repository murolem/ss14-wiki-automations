import { extendYamlSchemaWithAnyMappingTypeHandler, generateAnyMappingTypeHandler } from './customMappingType';

/** Field name for custom YAML types that are replaced in conversion process. */
export const yamlTypeFieldName = "!type";

const anyMappingTypeHandlerIdForTag = generateAnyMappingTypeHandler(yamlTypeFieldName);
export const yamlSchema = extendYamlSchemaWithAnyMappingTypeHandler(anyMappingTypeHandlerIdForTag);