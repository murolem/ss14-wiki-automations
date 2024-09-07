import dotenv from 'dotenv';
import fs, { ensureDirSync } from 'fs-extra';
import path from 'path';
import { assertPathExists, bytesToKilobytes, bytesToMegabytes, copyListOfFilesRecursively, getFilesInDirectoryRecursively } from '../utils';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import assert, { rejects } from 'assert';
const logger = new Logger("01-import-source-data");
const { logInfo, logError } = logger;
import { spawn, SpawnOptions } from 'child_process'
import { DataPath, dataPaths, projectRelPaths, ss14RepoGitUrl } from '$src/preset';
import git from 'isomorphic-git';

// ===================

dotenv.config();


assertPathExists(projectRelPaths.ss14Repo, "ss14 directory path doesn't exist: " + projectRelPaths.ss14Repo);

logInfo(chalk.bold("validating data paths"))

const dataPathsWithSs14Paths: [string /* data path alias */, DataPath][] = [];
for (const [dataPathAlias, dataPath] of Object.entries(dataPaths)) {
    if (!('ss14Path' in dataPath)) {
        logInfo(`data path ${chalk.bold(dataPathAlias)}: ${chalk.bold.gray("SKIPPED")} due to SS14 path being undefined`);

        continue;
    }

    const ss14AbsDataPath = path.resolve(path.join(projectRelPaths.ss14Repo, dataPath.ss14Path));
    assertPathExists(ss14AbsDataPath, `data path validation failed for ${chalk.bold(dataPathAlias)}: ss14 path doesn't exist`
        + `\n` + chalk.gray(ss14AbsDataPath));

    const isSs14AbsDataPathAFile = fs.statSync(ss14AbsDataPath).isFile();
    if (dataPath.type === 'file' && !isSs14AbsDataPathAFile) {
        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: expected ss14 path to lead to a file (due to the data path's type), found a directory instead`, {
            throwErr: true,
            additional: {
                ss14AbsDataPath
            }
        });
        throw '' // type guard
    } else if (dataPath.type === 'dir' && isSs14AbsDataPathAFile) {
        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: expected ss14 path to lead to a directory (due to the data path's type), found a file instead`, {
            throwErr: true,
            additional: {
                ss14AbsDataPath
            }
        });
        throw '' // type guard
    }

    if (!('projectInputPath' in dataPath)) {
        logError(`data path validation failed for ${chalk.bold(dataPathAlias)}: no project input dir path defined`, {
            throwErr: true
        });
        throw '' // type guard
    }

    dataPathsWithSs14Paths.push([dataPathAlias, dataPath]);

    logInfo(`data path ${chalk.bold(dataPathAlias)}: ${chalk.bold.green("OK")}`);
    logInfo(chalk.gray(ss14AbsDataPath))
}

// ===================

logInfo(chalk.bold("importing data paths"));

if (fs.existsSync(projectRelPaths.inputData)) {
    fs.emptyDirSync(projectRelPaths.inputData);
} else {
    fs.ensureDirSync(projectRelPaths.inputData)
}

for (const [dataPathAlias, dataPath] of dataPathsWithSs14Paths) {
    // import dir or file path. exists, validated earlier.
    const dataPathSs14AbsPath = path.join(projectRelPaths.ss14Repo, dataPath.ss14Path!);

    logInfo(`importing ${dataPath.type === 'file' ? 'file' : 'directory'} at data path ${chalk.bold(dataPathAlias)}`);
    logInfo(chalk.gray(dataPathSs14AbsPath));

    // get the dir path that will contain our file/files
    const dataPathProjectInputDirRelPath = dataPath.type === 'file'
        ? path.parse(dataPath.projectInputPath!).dir
        : dataPath.projectInputPath!
        ;

    const dataPathProjectDirAbsPath = path.resolve(path.join(projectRelPaths.inputData, dataPathProjectInputDirRelPath));
    ensureDirSync(dataPathProjectDirAbsPath);

    const dataPathProjectInputAbsPath = path.resolve(path.join(projectRelPaths.inputData, dataPath.projectInputPath!));
    let filesCopiedTotal = 0;
    if (dataPath.type === 'file') {
        fs.ensureDir(path.parse(dataPathProjectInputAbsPath).dir);
        fs.copyFileSync(dataPathSs14AbsPath, dataPathProjectInputAbsPath);

        filesCopiedTotal++;
    } else {
        const filesToImport = getFilesInDirectoryRecursively(dataPathSs14AbsPath);
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