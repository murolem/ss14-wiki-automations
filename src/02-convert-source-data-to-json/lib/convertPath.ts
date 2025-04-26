import { stepAbsDirPaths } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { Logger } from '$logger';
import chalk from 'chalk';
import yaml, { YAMLException } from 'js-yaml';
import { yamlSchema } from './yamlSchema';
import path from 'path';
import { isYamlFile } from './utils/isYamlFile';
import { replacePathExtension } from './utils/replacePathExtension';
import { readFilesRecursive } from '$utils/readFilesRecursive';

const logger = new Logger("02-convertPath");
const { logDebug, logInfo, logWarn, logFatal } = logger;

/**
 * Convert given path (file or dir; relative to the SS14 repo) from YML to JSON.
 * 
 * If path is a file, it's assumed to be a JSON file. 
 * If path is a directory, it's searched for JSON files.
 * 
 * Converted files are saved to converted step directory under the same relative path (relative to the step directory).
 * Any non-YML files are ignored.
 * 
 * @param inputPath Source path relative to the source data step directory.
 * @throws {Error} If path doesn't exist.
 */
export function convertPath(inputPath: string): void {
    const sourcePath = toOsPath(`${stepAbsDirPaths.inputData}/${inputPath}`);
    let targetPath = toOsPath(`${stepAbsDirPaths.convertedData}/${inputPath}`);

    logInfo(`convert to JSON ${chalk.bold(inputPath)}`);

    if (!fs.existsSync(sourcePath)) {
        logFatal({
            msg: "failed to convert path: source path doesn't exist",
            throw: true,
            data: {
                sourcePath
            }
        });
        throw ''
    }

    if (fs.statSync(sourcePath).isDirectory()) {
        convertDirectoryPath(sourcePath, targetPath, true);
    } else {
        targetPath = replacePathExtension(
            targetPath,
            '.json'
        );
        convertFilePath(sourcePath, targetPath, true);
    }
}

/** Internal convert function used specifically for directory paths. */
function convertDirectoryPath(absSourcePath: string, absTargetPath: string, skipExistsCheck = false): void {
    if (!skipExistsCheck && !fs.existsSync(absSourcePath)) {
        logFatal({
            msg: "failed to convert path: source path doesn't exist",
            throw: true,
            data: {
                sourcePath: absSourcePath
            }
        });
        throw ''
    }

    fs.ensureDirSync(absTargetPath);

    for (const relPath of readFilesRecursive(absSourcePath)) {
        const absSourceFilePath = toOsPath(`${absSourcePath}/${relPath}`);
        if (!isYamlFile(absSourceFilePath)) {
            continue;
        }

        logDebug(`  found ${relPath}`);

        let absTargetFilePath = replacePathExtension(
            toOsPath(`${absTargetPath}/${relPath}`),
            '.json'
        );

        convertFilePath(absSourceFilePath, absTargetFilePath, true);
    }
}

/** Internal convert function used specifically for file paths. */
function convertFilePath(absSourcePath: string, absTargetPath: string, skipExistsCheck = false): void {
    if (!skipExistsCheck && !fs.existsSync(absSourcePath)) {
        logFatal({
            msg: "failed to convert path: source path doesn't exist",
            throw: true,
            data: {
                sourcePath: absSourcePath
            }
        });
        throw ''
    }

    let result: unknown = [];
    try {
        result = yaml.load(
            fs.readFileSync(absSourcePath, 'utf8'),
            { schema: yamlSchema }
        );

        if (result === undefined || result === null) {
            logWarn(`^ empty YML document ${absSourcePath}`);
            result = []
        }
    } catch (err) {
        if (err instanceof YAMLException
            && err.message.startsWith('unknown tag')
        ) {
            logFatal({
                msg: `YAML to JSON conversion failed: unknown YML tag. Make sure the schema you are using can handle this custom type.`,
                throw: true,
                data: {
                    sourcePath: absSourcePath,
                    originalErrorMessage: err.message
                }
            });
        } else {
            logFatal({
                msg: "YAML to JSON conversion failed: unknown error",
                throw: true,
                data: {
                    originalError: err
                }
            });
        }
    }

    fs.ensureDirSync(path.parse(absTargetPath).dir);
    fs.writeJsonSync(absTargetPath, result, { spaces: 4 });
}