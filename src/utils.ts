import fs from 'fs-extra';
import path from 'path';
import Logger from '@aliser/logger';
import { execSync } from 'child_process';
import chalk from 'chalk';
import jsonDiff from 'json-diff';
const logger = new Logger("utils (/src)");
const { logInfo, logError } = logger;

// source: https://stackoverflow.com/a/76276541
export type LastElementOf<T extends unknown[]> = T extends [...unknown[], infer Last]
    ? Last
    : never;

export function assertPathExists(pathStr: string, message?: string): void {
    if (!fs.existsSync(pathStr)) {
        throw new Error(message ? message + `\n${chalk.gray(pathStr)}` : ("path doesn't exist: " + pathStr))
    }
}

export type FileEntryFromRecursiveFileFunctions = {
    /** Absolute path to the file. */
    absFilepath: string,

    /** Filename. */
    filename: string,

    /** 
     * A directory path relative to `dirPath`. 
     * Is an empty string for files in `dirPath`. 
     */
    relDirpath: string,

    /**
     * A file path relative to `dirPath`.
     */
    relFilepath: string
}

/** 
 * Converts a filepath to a format used in recursive utility file functions.
 * 
 * @param filepath Path to file.
 * @param baseDirPath Path to a "starting" directory. Note that the file must be inside that directory.
 * Default is `.` for current directory.
 * 
 * @throws Error if a file is not located within the base directory.
 *  */
export function convertFilepathToFileEntryFromRecursiveFileFunctions(
    filepath: string,
    baseDirPath: string = '.'
): FileEntryFromRecursiveFileFunctions {
    const absBaseDirPath = path.resolve(baseDirPath);

    const absFilepath = path.resolve(filepath);

    return {
        absFilepath: absFilepath,
        relDirpath: baseDirPath,
        filename: path.parse(absFilepath).base,
        relFilepath: path.join(baseDirPath, path.relative(absBaseDirPath, absFilepath))
    }
}

/**
 * Returns a list of files in directory `dirPath` including subdirectories.
 * @param dirPath 
 */
export function getFilesInDirectoryRecursively(dirPath: string): Array<FileEntryFromRecursiveFileFunctions> {
    const relFilepathObjects = fs.readdirSync(dirPath, { recursive: true, withFileTypes: true });
    return relFilepathObjects
        .filter(filepathObj => filepathObj.isFile())
        .map(filepathObj => {
            const relDirpath = path.relative(dirPath, filepathObj.path);

            return {
                absFilepath: path.resolve(path.join(filepathObj.path, filepathObj.name)),
                filename: filepathObj.name,
                relDirpath,
                relFilepath: path.join(relDirpath, filepathObj.name)
            }
        });
}

export function copyListOfFilesRecursively(files: FileEntryFromRecursiveFileFunctions[] | string[], toDirPath: string): {
    filesCopiedCount: number,
    bytesCopiedCount: number
} {
    fs.ensureDirSync(toDirPath);

    let filesCopiedCount = 0;
    let bytesCopiedCount = 0;
    for (const entry of files) {
        const { relDirpath, filename, absFilepath: inputFilepath } = typeof entry === 'string'
            ? convertFilepathToFileEntryFromRecursiveFileFunctions(entry)
            : entry;

        const outputFilepath = path.join(toDirPath, relDirpath, filename);
        const outputDirpath = path.parse(outputFilepath).dir;
        if (!fs.existsSync(outputDirpath)) {
            fs.mkdirSync(outputDirpath, { recursive: true });
        }

        fs.copyFileSync(inputFilepath, outputFilepath);

        bytesCopiedCount += fs.statSync(inputFilepath).size;
        filesCopiedCount++;
    }

    return {
        filesCopiedCount,
        bytesCopiedCount
    }
}

export function copyFilesRecursively(fromDirPath: string, toDirPath: string): {
    filesCopiedCount: number,
    bytesCopiedCount: number
} {
    const files = getFilesInDirectoryRecursively(fromDirPath);
    return copyListOfFilesRecursively(files, toDirPath);
}

/** Creates a copy of `data` using JSON.stringify() and then JSON.parse(). */
export function jsonClone<T extends unknown>(data: unknown): T {
    return JSON.parse(JSON.stringify(data));
}

/** Makes the first letter upper-case. */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* tslint:disable:no-empty */
export function noop(...args: any): void { }

export function bytesToKilobytes(bytes: number, digits: number = 2): number {
    return roundToDigit(bytes / 1024, digits);
}

export function bytesToMegabytes(bytes: number, digits: number = 2): number {
    return roundToDigit(bytes / 1048576, digits); // 1024 ^ 2
}

export function roundToDigit(value: number, digits: number) {
    const factor = Math.pow(10, digits);

    return Math.round(value * factor) / factor;
}

/** Checks whether given filename is for yaml file by seeing if it has `yml` or `yaml` extension. */
export function isFilenameForYamlFile(filename: string): boolean {
    return filename.endsWith('.yml') || filename.endsWith('.yaml');
}

/**
 * Clones an object using `JSON.stringify` and then `.parse`.
 * @param obj an object to clone.
 * @returns a cloned object.
 */
export function deepCloneObjectUsingJson(obj: object): unknown {
    return JSON.parse(JSON.stringify(obj));
}

/** Checks whether given object is a record: `object` type, not `null`, not an array. */
export function isRecord(obj: object): boolean {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Merges object `topObj` with object `baseObj` recursively.
 * 
 * **WARNING:** The resulting object is initialized with `baseObj` using `JSON.stringify()` and `JSON.parse()`,
 * so it would lose things that are unsupported by JSON, such as functions.
 * 
 * When a name conflict happens, the resolver kicks-in, comparing the value types of old/new prop:
 * - If the new value of a primitive type (string, number, etc.), it will replaced.
 * - If new value is an array, and the old one as well - new items will be appended to the end.
 * If the old value is something else, it will be replaced.
 * - If new value is an object (excluding arrays and `null`), and the old one as well - 
 * new properties will be inserted, resolving collisions as described.
 * If the old value is something else, it will be replaced.
 * - `null` properties are left unchanged.
 * 
 * @param baseObj 
 * @param topObj
 * 
 * @throws If any of the objects are `null`. 
 */
export function mergeJsonObjects(baseObj: object, topObj: object) {
    if (baseObj === null || topObj === null) {
        new Logger("mergeObjects()").logError("failed to merge objects: one on the objects is null", {
            throwErr: true,
            additional: {
                baseObj,
                topObj
            }
        });
        throw ''//type guard
    }

    const resultObj = deepCloneObjectUsingJson(baseObj) as any;
    for (const [key, value] of Object.entries(topObj)) {
        /** Whether the property is already present in the base object. */
        const isPresentInBaseObj = key in baseObj;

        /** 
         * Type of the same property in the base object. `undefined` in cases where it's not present.
         * Not that the property too can have an `undefined` value.
         */
        const typeOfPropertyInBaseObj = isPresentInBaseObj ? typeof (baseObj as any)[key] : undefined;

        switch (typeof value) {
            case 'object':
                if (value === null) {
                    if (!isPresentInBaseObj) {
                        resultObj[key] = value;
                    }
                } else if (Array.isArray(value)) {
                    if (isPresentInBaseObj && typeOfPropertyInBaseObj === 'object' && Array.isArray((baseObj as any)[key])) {
                        resultObj[key].push(...value)
                    } else {
                        resultObj[key] = value;
                    }
                } else {
                    // value is a record

                    if (isPresentInBaseObj) {
                        resultObj[key] = mergeJsonObjects(resultObj[key], value);
                    } else {
                        resultObj[key] = value;
                    }
                }

                break;
            default:
                resultObj[key] = value;
        }
    }

    return resultObj;
}

/**
 * A promise `resolve` function.
*/
export type Resolve<T = any> =
    /**
     * @param value a value to resolve the promise with.
     */
    (value: T) => void;

/**
 * A promise `reject` function.
*/
export type Reject<T = any> =
    /**
     * @param reason an optional reject reason.
     */
    (reason?: T) => void;

/**
 * A function that executes in promise.
 */
export type Executor<T = any, A = any> =
    /**
     * @param resolve a function that resolves the promise.
     * @param reject a function that rejects the promise.
     */
    (resolve: Resolve<T>, reject: Reject<A>) => void;

/**
 * A regular Promise but with its `resolve` and `reject` handles exposed.
 */
export class DeferredPromise<T> extends Promise<T> {
    resolve: Resolve<T>;
    reject: Reject<any>;

    constructor(executor: Executor<T> = noop) {
        let resolveHandle: Resolve<T>;
        let rejectHandle: Reject<any>;
        super((resolve, reject) => {
            resolveHandle = resolve;
            rejectHandle = reject;

            executor(resolve, reject);
        });

        this.resolve = resolveHandle!;
        this.reject = rejectHandle!;
    }
}


/** 
 * Returns the short commit name e.g. `adde490` for a Git repo located at `pathToRepo` for HEAD.
 * 
 * If there's no repo at that path, well... we'll find out what happens then.
 */
export function getLocalGitRepoHeadShortCommitHash(pathToRepo: string) {
    return execSync('git rev-parse --short HEAD', { cwd: pathToRepo })
        .toString().trim();
}

/**
 * Checks if 2 objects produced from JSON.parse() are equal.
 */
export function areJsonObjectsEqual(obj1: unknown, obj2: unknown): boolean {
    return jsonDiff.diff(obj1, obj2) === undefined;
}