import { DataPath, dataPaths, extendedLogging, projectRelPaths } from '$src/preset';
import { assertPathExists, convertFilepathToFileEntryFromRecursiveFileFunctions, FileEntryFromRecursiveFileFunctions, getFilesInDirectoryRecursively, isRecord, LastElementOf } from '$src/utils';
import chalk from 'chalk';
import { z, ZodType } from 'zod';
import Logger from '@aliser/logger';
import path from 'path';
const logger = new Logger("03/processAndSaveConvertedData()");
const { logInfo, logError, logWarn } = logger;
import fs, { stat } from 'fs-extra';
import { ProcessAndSaveConvertedDataProcessor } from '$src/03-process-converted-data/processAndSaveConvertedData/types';

export function processAndSaveConvertedData<
    TOptionalReturnType extends unknown
>({
    operationBeforeStartLog,
    convertedDataPathAlias,
    outputDataPathAlias,
    processor
}: {
    /** An optional message to log before the start of processing. */
    operationBeforeStartLog?: string,

    /** 
     * Data path alias for converted files. 
     * 
     * Converted files under this alias will be processed by this function.
     * 
     * In case where there's no converted files, but you still want to utilize the processor - use `noop` as a value.
     * In this mode, no converted files will be read. 
     * */
    convertedDataPathAlias: keyof typeof dataPaths,

    /** 
     * Data path alias for output file. 
     * 
     * Processed data will be saved to that file.
     * */
    outputDataPathAlias: keyof typeof dataPaths,

    /** 
     * A function used to process converted files.
     * a
     * Basic usage is to get `files`, parse them using `parseFiles` and write them to output with `writeToOutput`.
     * 
     * @returns Whatever you returns. This returned data will be also returns by the parent `processAndSaveConvertedData` function. 
     */
    processor: ProcessAndSaveConvertedDataProcessor<TOptionalReturnType>
}): TOptionalReturnType {
    const convertedDataPath = dataPaths[convertedDataPathAlias];
    const outputDataPath = dataPaths[outputDataPathAlias];

    const isNoopForConvertedData = convertedDataPathAlias === 'noop';

    if (operationBeforeStartLog) {
        logInfo(operationBeforeStartLog);
    }

    if (isNoopForConvertedData) {
        logInfo(chalk.gray(`${chalk.bold('noop')} set for converted files - running processing without them`));
    } else {
        logInfo(chalk.magenta(`processing ${convertedDataPath.type === 'file' ? 'file' : 'directory'} at data path ${chalk.bold(convertedDataPathAlias)}`));
    }


    if (!('projectConvertedPath' in convertedDataPath)) {
        logError(`failed to process and save converted data for data path ${chalk.bold(convertedDataPathAlias)}: no project converted path is defined for this data path`, {
            throwErr: true
        });
        throw ''// type guard
    } else if (!('projectOutputFilePath' in outputDataPath)) {
        logError(`failed to process and save converted data for data path ${chalk.bold(outputDataPathAlias)}: no project output path is defined for this data path`, {
            throwErr: true
        });
        throw ''// type guard
    }


    const dataPathConvertedDataAbsPath = path.resolve(path.join(
        projectRelPaths.convertedData, convertedDataPath.projectConvertedPath
    ));

    if (!isNoopForConvertedData) {
        logInfo(chalk.gray(dataPathConvertedDataAbsPath));
    }

    let files: FileEntryFromRecursiveFileFunctions[];
    if (isNoopForConvertedData) {
        files = [];
    } else {
        assertPathExists(dataPathConvertedDataAbsPath, `failed to process and save converted data for data path ${chalk.bold(outputDataPathAlias)}: converted data path doesn't exist`);

        files = convertedDataPath.type === 'file'
            ? [convertFilepathToFileEntryFromRecursiveFileFunctions(dataPathConvertedDataAbsPath, projectRelPaths.convertedData)]
            : getFilesInDirectoryRecursively(dataPathConvertedDataAbsPath);
    }

    const dataPathOutputDataAbsFilePath = path.resolve(path.join(
        projectRelPaths.outputData, outputDataPath.projectOutputFilePath
    ));

    return processor({
        convertedDataPathAlias,
        convertedDataPath,
        outputDataPathAlias,
        outputDataPath,
        files,
        parseFiles(files, ...validators) {
            return files.flatMap((file, i) => {
                if (extendedLogging['processConvertedData.currently-being-parsed-files']) {
                    logInfo(`${chalk.magenta('▮')} [${i + 1} of ${files.length}] parsing file: ${chalk.bold(file.relFilepath)}`);
                    logInfo(chalk.gray(file.absFilepath));
                }

                let resultingEntries: unknown[] = fs.readJSONSync(file.absFilepath);
                for (const [i, validator] of validators.entries()) {
                    // every validator except the last works in filtering mode.
                    // nothing is done to the entries in filtering mode - only validating.
                    // parsed result from the last validator is used as a result.
                    const inFilteringMode = i < validators.length - 1;

                    const iterationEntries: unknown[] = [];
                    for (const entry of resultingEntries) {
                        if (extendedLogging['processConvertedData.validators']) {
                            if (isRecord(entry as any) && 'id' in (entry as object)) {
                                logInfo(chalk.gray(`applying ${inFilteringMode ? 'filtering' : 'transforming'} validator #${i + 1} to entry ${chalk.bold((entry as Record<any, any>).id)}`));
                            } else {
                                logInfo(chalk.gray(`applying ${inFilteringMode ? 'filtering' : 'transforming'} validator #${i + 1} to entry without ID`));
                            }
                        }

                        let parsedEntry;
                        try {
                            if (inFilteringMode) {
                                // in filtering mode, only parse for validating purposes,
                                // assigning the same entry as a parsed entry
                                validator.parse(entry);
                                parsedEntry = entry;

                                if (extendedLogging['processConvertedData.validators']) {
                                    logInfo(chalk.gray("result: kept"))
                                }
                            } else {
                                // in non-filtering mode, parsed entry is, will, a parsed entry
                                parsedEntry = validator.parse(entry);
                            }
                        } catch (err) {
                            if (inFilteringMode) {
                                if (extendedLogging['processConvertedData.validators']) {
                                    logInfo(chalk.gray(`result: ${chalk.bold("filtered out")}`));
                                }

                                // skip entry if in filtering mode
                                continue;
                            } else {
                                // throw error if not in filtering mode
                                logError(`${chalk.magenta('▮')} [file ${i + 1} of ${files.length}] failed to process and save converted data: validation error on validator #${i + 1}`, {
                                    throwErr: true,
                                    additional: {
                                        filepath: file.absFilepath,
                                        error: err
                                    }
                                });
                                throw ''//type guard
                            }
                        }

                        iterationEntries.push(parsedEntry);
                    }

                    resultingEntries = iterationEntries;
                }

                if (extendedLogging['processConvertedData.currently-being-parsed-files']) {
                    logInfo(`${chalk.bold.green('OK')}, parsed entries: ${chalk.underline(resultingEntries.length)}`);
                }

                return resultingEntries;
            });
        },
        writeToOutput(data, { stringifyJson = true } = {}) {
            fs.ensureDirSync(path.parse(dataPathOutputDataAbsFilePath).dir);
            if (stringifyJson) {
                fs.writeJSONSync(dataPathOutputDataAbsFilePath, data, { spaces: 4 });
            } else {
                fs.writeFileSync(dataPathOutputDataAbsFilePath, data);
            }
        }
    })
}