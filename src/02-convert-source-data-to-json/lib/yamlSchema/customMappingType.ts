import yaml, { TypeConstructorOptions } from 'js-yaml';
import { BASE_YAML_SCHEMA, MappingTagHandler } from './base';
import { Logger } from '$logger';

const logger = new Logger("customMappingType");
const { logFatal } = logger;

/**
 * Generates a YML schema with support for any custom mapping type by adding a `handler` for any such type.
 * @param newTypePropertyName A property name to copy the tag into. 
 * `!` (or `!type:`) are removed from the copied string.
 * @returns An any mapping type handler function.
 */
export const generateAnyMappingTypeHandler = (
    newTypePropertyName: string
): MappingTagHandler => {
    return function (data, tag) {
        // assert data is an object (this includes "null")
        if (typeof data !== 'object') {
            logFatal({
                msg: `failed to parse a custom mapping type while parsing YAML: expected data to be an object (aka mapping type), received ${typeof data}.`,
                throw: true,
                data: {
                    tag,
                    data
                },
                stringifyData: true
            });
            throw ''//type guard
        }

        // if data is "null", replace it with an empty object
        // since we always produce an object
        if (data === null) {
            data = {}
        }

        // check for collision with the data just in case 
        if (newTypePropertyName in (data as object)) {
            logFatal({
                msg: `failed to parse a custom mapping type while parsing YAML: data contains a property with key '${newTypePropertyName}', which is used to copy the custom tag into. Change the tag used for the schema to fix the error`,
                throw: true,
                data: {
                    tag,
                    data
                },
                stringifyData: true
            });
            throw '' // type guard
        }

        return {
            // since we're using the tag, remove the type prefix from it
            [newTypePropertyName]: tag
                .replace('!type:', '')
                .replace('!', ''),

            ...(data as object),
        }
    }
}

/**
 * Adds support for any custom mapping type by adding a `handler` for any such type.
 * 
 * Must only be used once per schema, otherwise won't have any effect.
 */
export function extendYamlSchemaWithAnyMappingTypeHandler(handle: MappingTagHandler) {
    const type = new yaml.Type('!', {
        kind: "mapping",

        // Loader must check if the input object is suitable for this type.
        resolve() { return true },

        // If a node is resolved, use it to create a Point instance.
        construct: wrapMappingTypeHandler(handle),

        multi: true
    });

    return BASE_YAML_SCHEMA.extend(type);
}

/** Wraps handler to allow for its narrowed types. */
function wrapMappingTypeHandler(handler: MappingTagHandler): (data: any, tag?: string) => any {
    return (data: any, tag?: string) => {
        if (tag === undefined) {
            throw new Error("failed to parse a yaml doc: undefined tag");
        }

        return handler(data, tag);
    }
}