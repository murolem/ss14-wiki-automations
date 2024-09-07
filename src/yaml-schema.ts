import Logger from '@aliser/logger';
import yaml, { TypeConstructorOptions } from 'js-yaml';
import { unknown } from 'zod';
const logger = new Logger("yaml-schema");
const { logInfo, logError } = logger;

/** Base schema used in further schema generations. */
const BASE_YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
    // seems to be just a number
    new yaml.Type('!type:Single', {
        kind: 'scalar',
        resolve() { return true },
        construct(data) { return data }
    }),

    // bool
    new yaml.Type('!type:Bool', {
        kind: 'scalar',
        resolve() { return true },
        construct(data) { return data }
    }),
]);

export type CustomTagsProcessor = (data: unknown, tag: string) => unknown;

export const generatePassthroughTagsProcessor = (propertyNameToUseForType: string): CustomTagsProcessor => {
    return function (data, tag) {
        // assert data is an object (this includes "null")
        if (typeof data !== 'object') {
            logError(`failed to parse a yaml doc: expected data to be an object, received ${typeof data}.`, {
                throwErr: true,
                additional: data
            });
            throw '' // type guard
        }

        // if data is "null", replace it with an empty object
        // since we always produce an object
        if (data === null) {
            data = {}
        }

        // check for collision with the data just in case 
        if (propertyNameToUseForType in (data as object)) {
            logError(`failed to parse a yaml doc: current object property cannot contain an '${propertyNameToUseForType}' property, since it\'s used for the type.`, {
                throwErr: true,
                additional: data
            });
            throw '' // type guard
        }

        return {
            // since we're using the tag, remove the type prefix from it
            [propertyNameToUseForType]: tag.replace('!type:', ''),

            ...(data as object),
        }
    }
}

export const passthroughCustomTagsProcessor: CustomTagsProcessor = (data, tag) => {
    // assert data is an object (this includes "null")
    if (typeof data !== 'object') {
        logError(`failed to parse a yaml doc: expected data to be an object, received ${typeof data}.`, {
            throwErr: true,
            additional: data
        });
        throw '' // type guard
    }

    // if data is "null", replace it with an empty object
    // since we always produce an object that contains at least an "id"
    if (data === null) {
        data = {}
    }

    // check for "id" collision with the data
    if (Object.hasOwn(data as object, 'id')) {
        logError('failed to parse a yaml doc: current object property cannot contain an "id" property, since it\'s used for the type.', {
            throwErr: true,
            additional: data
        });
        throw '' // type guard
    }

    return {
        // since we're using the tag, remove the type prefix from it
        id: tag.replace('!type:', ''),

        ...(data as object),
    }
}

export const explicitPassthroughCustomTagsProcessor: CustomTagsProcessor = (data, tag) => {
    // assert data is an object (this includes "null")
    if (typeof data !== 'object') {
        logError(`failed to parse a yaml doc: expected data to be an object, received ${typeof data}.`, {
            throwErr: true,
            additional: data
        });
        throw '' // type guard
    }

    // if data is "null", replace it with an empty object
    // since we always produce an object that contains at least an "id"
    if (data === null) {
        data = {}
    }

    const typePropName = '@@YAML-TYPE@@';

    // check for collision with the data just in case 
    if (Object.hasOwn(data as object, 'id')) {
        logError(`failed to parse a yaml doc: current object property cannot contain an '${typePropName}' property, since it\'s used for the type.`, {
            throwErr: true,
            additional: data
        });
        throw '' // type guard
    }

    return {
        // since we're using the tag, remove the type prefix from it
        [typePropName]: tag.replace('!type:', ''),

        ...(data as object),
    }
}

/**
 * Generates a yaml schema to use in parsing yaml files.
 * 
 * By default, generates a schema that allows any custom tags, but it applies a transform
 * to the properties. See {@link PASSTHROUGH_YAML_SCHEMA} for details.
 */
export function generateYamlSchema({
    customTagsProcessor
}: {
    customTagsProcessor: CustomTagsProcessor
}) {
    function constructType(data: unknown, tag: string | undefined): any {
        if (tag === undefined) {
            throw new Error("failed to parse a yaml doc: undefined tag");
        }

        return customTagsProcessor(data, tag);
    }

    const types = (["mapping"] as TypeConstructorOptions['kind'][])
        .map(kind => {
            return new yaml.Type('!', {
                kind,

                // Loader must check if the input object is suitable for this type.
                resolve() { return true },

                // If a node is resolved, use it to create a Point instance.
                construct: constructType,

                multi: true

                // Dumper must process instances of Point by rules of this YAML type.
                // instanceOf: Point,

                // Dumper must represent Point objects as three-element sequence in YAML.
                // represent: function (point) {
                //   return [ point.x, point.y, point.z ];
                // }
            });
        });

    return BASE_YAML_SCHEMA.extend(types);
}

/** 
 * A yaml schema that will process custom tags for objects in following way:
 * 1. The `!type` property is renamed to a regular property called `id`. 
 * 2. The rest of the properties are just added to that object.
 * 
 * In case of a collision, where an `id` property already exists, an error will be thrown.
 * 
 * For instance, given an yaml object
 * ```yaml
...
shape:
    !type:PhysShapeAabb
    bounds: "-0.4,-0.4,0.4,0.4"
...
 * ```
 * the resulting json object is
 * ```json
...
"shape": {
    "id": "PhysShapeAabb", 
    "bounds": "-0.4,-0.4,0.4,0.4"
}
...
 * ```
 */
export const PASSTHROUGH_YAML_SCHEMA = generateYamlSchema({
    customTagsProcessor: generatePassthroughTagsProcessor('id')
});

/**
 * A schema similar to `PASSTHROUGH_YAML_SCHEMA`, but instead of mapping type to `id`, 
 * it uses `@@YAML-TYPE@@` as a property name. It's unlikely, that there would be a property with that name, so it
 * "guarantees" no collisions with object that have an `id` field. 
 */
export const EXPLICIT_PASSTHROUGH_YAML_SCHEMA = generateYamlSchema({
    customTagsProcessor: generatePassthroughTagsProcessor('@@YAML-TYPE@@')
});




// const types: [string, yaml.TypeConstructorOptions][] = [
//     // ## metabolisms ##

//     ['!type:ExplosionReactionEffect', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:AreaReactionEffect', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:EmpReactionEffect', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CreateEntityReactionEffect', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CreateGas', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PopupMessage', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:RobustHarvest', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Polymorph', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Oxygenate', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ChemCleanBloodstream', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ActivateArtifact', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Emote', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CleanTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CleanDecalsReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ModifyBleedAmount', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:GenericStatusEffect', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CreateEntityTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Electrocute', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ExtinguishTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:AdjustTemperature', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ExtinguishReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:MovespeedModifier', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ModifyLungGas', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:AdjustAlert', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:FlammableTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:FlammableReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Drunk', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Jitter', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CureZombieInfection', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ChemHealEyeDamage', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:MakeSentient', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ResetNarcolepsy', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ReduceRotting', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Ignite', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PryTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:CauseZombieInfection', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:SpillIfPuddlePresentTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:SatiateThirst', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:AdjustReagent', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:HealthChange', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:SpillTileReaction', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:SatiateHunger', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ChemVomit', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ModifyBloodLevel', { kind: 'mapping', construct: constructUnknownType }],

//     // plant stuff
//     ['!type:PlantAdjustNutrition', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustHealth', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustMutationMod', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustToxins', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustPests', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustWeeds', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAffectGrowth', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantDiethylamine', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustMutationLevel', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantCryoxadone', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantPhalanximine', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:PlantAdjustWater', { kind: 'mapping', construct: constructUnknownType }],

//     // conditions
//     ['!type:OrganType', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:ReagentThreshold', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:HasTag', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Temperature', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:MobStateCondition', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:TotalDamage', { kind: 'mapping', construct: constructUnknownType }],
//     ['!type:Hunger', { kind: 'mapping', construct: constructUnknownType }],