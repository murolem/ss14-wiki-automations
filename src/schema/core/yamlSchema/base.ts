import yaml from 'js-yaml';

/** A processor function for custom YML mapping tags. */
export type MappingTagHandler = (data: unknown, tag: string) => unknown;

/** Base schema used in any other schemas. */
export const BASE_YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
    // float
    new yaml.Type('!type:Single', {
        kind: 'scalar',
        resolve() { return true },
        construct(data) { return parseFloat(data) }
    }),

    // bool
    new yaml.Type('!type:Bool', {
        kind: 'scalar',
        resolve() { return true },
        construct(data) { return data === 'true' ? true : false }
    }),

    // string
    new yaml.Type('!type:String', {
        kind: 'scalar',
        resolve() { return true },
        construct(data) { return data }
    }),
]);