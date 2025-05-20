import { createProtoPool, resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { registerProcessor } from '$src/03-process-converted-data/lib/processor';
import { projectProcessingOutputs, projectStepDirpaths } from '$src/preset';
import { readFilesRecursive } from '$utils/readFilesRecursive';
import { toOsPath } from '$utils/toOsPath';
import chalk from 'chalk';
import fs from 'fs-extra';
import { Logger } from '$logger';
import type { z, ZodType } from 'zod';
import type { StringOr } from '$utils/stringOr';
import { schemaParse } from '$schemas/utils/assertSchema';
import { type KnownEntityComponentType, type EntityPrototype, type EntityComponent, entityComponentSchemaByType } from '$schemas/prototype/prototypes/entity';
import { prototypeArraySchema, type ProtoId, type Prototype } from '$schemas/prototype/base';
import { rawPrototypeSchemasByType, type RawPrototypeSchemaType } from '$schemas/prototype';
const logger = new Logger("process/processors/prototype");
const { logFatal } = logger;

let prototypes: Prototype[] = [];
let prototypeIds: string[] = [];

let loaded = false;

registerProcessor('prototypes', ({
    dirpath,
    stepDirpaths,
    outputDirpath,
    tempDirpath,
    logger,
    writeJsonSync
}) => {
    const { logDebug, logInfo, logFatal } = logger;

    const prototypesDirPath = projectStepDirpaths.prototypes.converted;

    logInfo(`loading prototypes for the first time; from: ${chalk.bold(prototypesDirPath)}`);

    if (!fs.existsSync(prototypesDirPath)) {
        logFatal({
            msg: `failed to load prototypes: path doesn't exist: ${prototypesDirPath}`,
            throw: true
        });
    }

    for (const relPath of readFilesRecursive(prototypesDirPath)) {
        logDebug(`  found ${relPath}`);

        const absPath = toOsPath(`${prototypesDirPath}/${relPath}`);

        const parsedResult = prototypeArraySchema.safeParse(fs.readJsonSync(absPath));
        if (!parsedResult.success) {
            const issuesLen = parsedResult.error.issues.length;
            const firstIssue = parsedResult.error.issues[0];

            // if (issuesLen === 1
            //     && firstIssue.code === 'invalid_type'
            //     && firstIssue.expected === 'array'
            //     && firstIssue.received === 'null'
            // ) {
            //     // file is empty, skip
            //     logDebug(`  ^file is empty, skipping`);
            //     continue;
            // }

            logFatal({
                msg: `failed to load prototypes: failed to parse prototype at: ${absPath}`,
                throw: true,
                data: {
                    parseError: parsedResult.error
                }
            });
            throw ''
        }

        logDebug(`  ^prototypes: ${parsedResult.data.length}`);

        for (const proto of parsedResult.data) {
            if (prototypeIds.includes(proto.id)) {
                logFatal({
                    msg: `failed to load prototypes: encountered a prototype '${proto.id}' with a duplicate ID. Found at: ${absPath}`,
                    throw: true
                });
            }

            prototypes.push(proto);
        }
    }

    logInfo(`prototypes loaded: ${chalk.bold(prototypes.length)}`);

    writeJsonSync(
        'temp',
        "prototypes_raw.json",
        prototypes
    );

    logInfo(chalk.gray(`resolving inheritance`));

    const protoPool = createProtoPool(prototypes);
    const prototypesResolved = prototypes
        .map(proto => resolveInheritance(proto, protoPool));
    prototypes = prototypesResolved;

    writeJsonSync(
        'output',
        projectProcessingOutputs.prototypes.prototypesJson,
        prototypesResolved
    );

    loaded = true;
});

/**
 * Checks whether prototypes have been loaded.
 * 
 * @throws {Error} If prototypes have not been loaded yet.
 */
function assertLoaded() {
    if (!loaded) {
        logFatal({
            msg: `prototypes loaded assertion failed: prototypes not loaded`,
            throw: true
        });
    }
}

export function getPrototypes() {
    assertLoaded();

    return prototypes;
}

// /** 
//  * Returns prototype by given ID.
//  * 
//  * @throws {Error} If no prototype with that ID exists.
//  */
// export function getProtoById(id: string): Prototype {

// }

/** 
 * Returns prototype by given type and ID or `null` if no prototype with that type and ID combo exists.
 */
export function tryGetProtoById(
    type: StringOr<RawPrototypeSchemaType>,
    id: string,
): Prototype | null {
    assertLoaded();

    const proto = prototypes.find(proto => proto.type === type && proto.id === id);
    return proto ?? null;
}

/** 
 * Returns prototype by given type and ID or `null` if no prototype with that type and ID combo exists.
 * 
 * If prototype is found, passes it through a matching schema.
 */
export function tryGetProtoByIdWithParse<T extends RawPrototypeSchemaType>(
    type: T,
    id: string
): z.infer<typeof rawPrototypeSchemasByType[T]> | null {
    assertLoaded();

    const proto = tryGetProtoById(type, id);
    if (proto) {
        const schema = rawPrototypeSchemasByType[type];

        return schemaParse(schema, proto);
    } else {
        return null;
    }
}

/**
 * Filters prototypes by type.
 * 
 * @param type Type to filter prototypes.
 */
export function filterProtosByType(type: StringOr<RawPrototypeSchemaType>): Prototype[] {
    assertLoaded();

    return prototypes
        .filter(proto => proto.type === type);
}

/** 
 * Filter prototypes by type and parses each to a known schema.
 * 
 * A schema must be defined for a prototype type.
*/
export function filterProtosByTypeWithParse<T extends RawPrototypeSchemaType>(
    type: T
): Array<z.infer<typeof rawPrototypeSchemasByType[T]>> {
    assertLoaded();

    const schema = rawPrototypeSchemasByType[type as RawPrototypeSchemaType];

    return prototypes
        .filter(proto => proto.type === type)
        .map(proto => schemaParse(schema, proto));
}

/**
 * Searches for a component in an entity prototype, returns match or `null`, if no such component was found.
 * @param entityProto Entity prototype to search in.
 * @param compType Component type to search for.
 */
export function tryGetComp<T extends StringOr<KnownEntityComponentType>>(
    entityProto: EntityPrototype,
    compType: T
): EntityComponent | null {
    return entityProto?.components
        ?.find(comp => comp.type === compType)
        ?? null;
}

/**
 * Searches for a component in an entity prototype.
 * - If component was found, parses it with a matching schema for given type. 
 * - If no component was found, returns `null`.
 * 
 * @param entityProto Entity prototype to search in.
 * @param compType Component type to search for.
 */
export function tryGetCompWithParse<T extends KnownEntityComponentType>(
    entityProto: EntityPrototype,
    compType: T
): z.infer<typeof entityComponentSchemaByType[T]> | null {
    const comp = entityProto?.components
        ?.find(comp => comp.type === compType);
    if (comp) {
        const schema = entityComponentSchemaByType[compType];

        return schemaParse(schema, comp);
    } else {
        return null;
    }
}