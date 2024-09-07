import fs from 'fs-extra';
import path from 'path';
import { assertPathExists, copyListOfFilesRecursively, getFilesInDirectoryRecursively } from '../utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { DataPath, dataPaths, projectRelPaths } from '$src/preset';
import { globSync } from 'glob';
const logger = new Logger("01-import-source-data");
const { logInfo, logError } = logger;

// ===================

logInfo(chalk.bold("validating data paths (basic)"));

assertPathExists(projectRelPaths.ss14Repo, "ss14 directory path doesn't exist: " + projectRelPaths.ss14Repo);

if (fs.existsSync(projectRelPaths.inputData)) {
    fs.emptyDirSync(projectRelPaths.inputData);
} else {
    fs.ensureDirSync(projectRelPaths.inputData)
}


const dataPathsToImportByAlias: [string /* data path alias */, DataPath][] = [];
for (const [dataPathAlias, dataPath] of Object.entries(dataPaths)) {
    // skip data paths without ss14 paths defined since we can't import those
    if (!('ss14Path' in dataPath)) {
        logInfo(`data path ${chalk.bold(dataPathAlias)}: ${chalk.bold.gray("SKIPPED")} due to SS14 path being undefined`);

        continue;
    }

    // figure out an absolute path from ss14 path
    const ss14AbsDataPath = path.resolve(path.join(projectRelPaths.ss14Repo, dataPath.ss14Path));
    assertPathExists(ss14AbsDataPath, `data path validation failed for ${chalk.bold(dataPathAlias)}: ss14 path doesn't exist`);

    // check if that absolute path is a file
    const isSs14AbsDataPathAFile = fs.statSync(ss14AbsDataPath).isFile();
    // if data path says it's a file and is not - throw error
    if (dataPath.type === 'file' && !isSs14AbsDataPathAFile) {
        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: expected ss14 path to lead to a file (due to the data path's type), found a directory instead`, {
            throwErr: true,
            additional: {
                ss14AbsDataPath
            }
        });
        throw '' // type guard
    } else if (dataPath.type === 'dir' && isSs14AbsDataPathAFile) {
        // if data path says it's a dir and is not - throw error

        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: expected ss14 path to lead to a directory (due to the data path's type), found a file instead`, {
            throwErr: true,
            additional: {
                ss14AbsDataPath
            }
        });
        throw '' // type guard
    }

    // if data path doesn't have an import path to where to import the file/files - throw error
    if (!('projectInputPath' in dataPath)) {
        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: no project input dir path defined`, {
            throwErr: true
        });
        throw '' // type guard
    }

    // if all good - add data path to list to do imports on
    dataPathsToImportByAlias.push([dataPathAlias, dataPath]);

    logInfo(`data path ${chalk.bold(dataPathAlias)}: ${chalk.bold.green("OK")}`);
    logInfo(chalk.gray(ss14AbsDataPath));
}

// ===================

logInfo(chalk.bold("importing data paths"));

for (const [dataPathAlias, dataPath] of dataPathsToImportByAlias) {
    // figure out an absolute path from ss14 path.
    // validated to be existing earlier.
    const dataPathSs14AbsPath = path.resolve(path.join(projectRelPaths.ss14Repo, dataPath.ss14Path!));

    logInfo(`importing ${dataPath.type === 'file' ? 'file' : 'directory'} at data path ${chalk.bold(dataPathAlias)}`);
    logInfo(chalk.gray(dataPathSs14AbsPath));

    // figure out an absolute path to the imported file/directory 
    const dataPathProjectInputAbsPath = path.resolve(path.join(projectRelPaths.inputData, dataPath.projectInputPath!));
    const dataPathProjectInputAbsPathParsed = path.parse(dataPathProjectInputAbsPath);

    let filesCopiedTotal = 0;
    if (dataPath.type === 'file') {
        if (dataPathProjectInputAbsPathParsed.ext === '') {
            // if a path doesn't have an extension, it's likely not a path to a file
            logError(`data path importing failed: given project import path is likely a directory path, when a file path was expected`, {
                throwErr: true,
                additional: {
                    projectInputPath: dataPath.projectInputPath
                }
            });
            throw '' // type guard
        }

        // if a single file is being imported, ensure a dir that will contain it
        fs.ensureDirSync(dataPathProjectInputAbsPathParsed.dir);
        fs.copyFileSync(dataPathSs14AbsPath, dataPathProjectInputAbsPath);

        filesCopiedTotal++;
    } else {
        if (dataPathProjectInputAbsPathParsed.ext !== '') {
            logError(`data path importing failed: given project import path is a filepath, when a directory path was expected`, {
                throwErr: true,
                additional: {
                    projectInputPath: dataPath.projectInputPath
                }
            });
            throw '' // type guard
        }

        let filesToImport = getFilesInDirectoryRecursively(dataPathSs14AbsPath);
        if (dataPath.ss14PathExcludeGlobs) {
            const relPathsToExclude = globSync(dataPath.ss14PathExcludeGlobs, { cwd: dataPathSs14AbsPath });

            filesToImport = filesToImport.filter(({ relFilepath }) => !relPathsToExclude.includes(relFilepath));
        }

        const { filesCopiedCount } = copyListOfFilesRecursively(filesToImport, dataPathProjectInputAbsPath);

        filesCopiedTotal += filesCopiedCount;

        // .filter(({ absFilepath, filename, relDirpath, relFilepath }) => {
        //     // when not in whitelist mode, set to true, allowing any file to pass
        //     const inWhitelist = relFilepathsWhitelist.length === 0 || relFilepathsWhitelist.includes(relFilepath);
        //     if (!inWhitelist) {
        //         return;
        //     }

        //     const inBlacklist = relFilepathsBlacklist.includes(relFilepath);

        //     if (inBlacklist) {
        //         logInfo(`file excluded: ${chalk.bold(relFilepath)}`);
        //         logInfo(`(${absFilepath})`);

        //         return;
        //     }

        //     return true;
        // });
    }

    // logInfo(`${chalk.bold.green("OK")}, copied files: ${chalk.underline(filesCopiedTotal)}`);
}