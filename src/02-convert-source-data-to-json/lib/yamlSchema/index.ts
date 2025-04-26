import { extendYamlSchemaWithAnyMappingTypeHandler, generateAnyMappingTypeHandler } from './customMappingType';

const anyMappingTypeHandlerIdForTag = generateAnyMappingTypeHandler("id");
export const yamlSchema = extendYamlSchemaWithAnyMappingTypeHandler(anyMappingTypeHandlerIdForTag);