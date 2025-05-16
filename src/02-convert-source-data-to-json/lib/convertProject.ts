import { projectStepDirpaths, type Project } from '$src/preset';
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
import { ensureDirectoryExistsEmpty } from '$utils/ensureDirectoryExistsEmpty';

const logger = new Logger("convert/convertProject");
const { logDebug, logInfo, logWarn, logFatal } = logger;

/**
 * Given a project, converts all found YML files in its input step directory to JSON files, 
 * saving them to the converted step directory.
 * 
 * @param inputPath Source path relative to the source data step directory.
 * @throws {Error} If path doesn't exist.
 */
export function convertProject(project: Project): void {
    const sourcePath = projectStepDirpaths[project].input;
    let targetPath = projectStepDirpaths[project].converted;

    logInfo(`convert to JSON project ${chalk.bold(project)}`);

    if (!fs.existsSync(sourcePath)) {
        logFatal({
            msg: "failed to convert project: source path doesn't exist",
            throw: true,
            data: {
                sourcePath
            }
        });
        throw ''
    }

    ensureDirectoryExistsEmpty(targetPath);
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
            msg: "failed to convert directory path: source path doesn't exist",
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
            msg: "failed to convert filepath: source path doesn't exist",
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