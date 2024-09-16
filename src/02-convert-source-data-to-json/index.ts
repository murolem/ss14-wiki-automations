import yaml, { YAMLException } from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { EXPLICIT_PASSTHROUGH_YAML_SCHEMA, PASSTHROUGH_YAML_SCHEMA } from '$src/yaml-schema';
import { getFilesInDirectoryRecursively, isFilenameForYamlFile } from '$src/utils';
import { dataPaths, projectRelPaths } from '$src/preset';
const logger = new Logger("02-convert-source-data-to-json");
const { logInfo, logError, logWarn } = logger;

logInfo(chalk.bold("converting input data"));

if (fs.existsSync(projectRelPaths.convertedData)) {
    fs.emptyDirSync(projectRelPaths.convertedData);
} else {
    fs.ensureDirSync(projectRelPaths.convertedData)
}

// ======== generate jsons ========

convertAndSaveInputData('recipes.lathes');
convertAndSaveInputData('recipes.lathes.machines', PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('recipes.lathes.categories', PASSTHROUGH_YAML_SCHEMA);

convertAndSaveInputData('item.source.entities.foldable', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.clothing', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.objects', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.structures', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.tiles', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.mobs', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.body.organs', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.body.parts', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.debugging', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.store.presets', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.catalog.fills', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.inventory-templates.inventorybase', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('item.source.entities.markers', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);

convertAndSaveInputData('item.source.reagents', EXPLICIT_PASSTHROUGH_YAML_SCHEMA);


convertAndSaveInputData('research.techs.parsed', PASSTHROUGH_YAML_SCHEMA);
convertAndSaveInputData('research.disciplines.parsed', PASSTHROUGH_YAML_SCHEMA);


// ==============

/** 
 * Converts a data path identified by an alias from YAML to JSON.
 * 
 * Converted file/files will be saved to the converted data directory.
 * 
 * Non-`yml`/`yaml` files are ignored. 
 * 
 * @param dataPathAlias Data path alias.
 * @param yamlSchema Yaml schema to use to parse the files. By default, uses the standard schema, 
 * which will fail on unknown custom types.
 */
function convertAndSaveInputData(dataPathAlias: keyof typeof dataPaths, yamlSchema: yaml.Schema = yaml.DEFAULT_SCHEMA): void {
    const dataPath = dataPaths[dataPathAlias];

    if (!('projectInputPath' in dataPath)) {
        logError(`failed to convert and save the input data for data path ${dataPathAlias}: project input path is undefined`, {
            logError: true
        });
        throw '' // type guard
    } else if (!('projectConvertedPath' in dataPath)) {
        logError(`failed to convert and save the input data for data path ${dataPathAlias}: project converted path is undefined`, {
            logError: true
        });
        throw '' // type guard
    }

    // expecting this path to exist since it's checked in import source data script
    // this path can be either to a file or a directory.
    const dataPathProjectInputAbsPath = path.resolve(path.join(projectRelPaths.inputData, dataPath.projectInputPath));
    logInfo(`converting a ${dataPath.type === 'file' ? 'file' : 'directory'} at data path ${chalk.bold(dataPathAlias)}`);
    logInfo(chalk.gray(dataPathProjectInputAbsPath));

    // this path can be either to a file or a directory.
    const dataPathProjectConvertedAbsPath = path.resolve(path.join(projectRelPaths.convertedData, dataPath.projectConvertedPath));
    const dataPathProjectConvertedAbsPathParsed = path.parse(dataPathProjectConvertedAbsPath);

    let entriesFoundTotal = 0;
    let filesFoundTotal = 0;

    /**
     * Converts a file.
     * @returns The conversion result.
     */
    function convertFile(absFilepath: string): unknown {
        // Get document, or throw exception on error
        try {
            const doc = yaml.load(
                fs.readFileSync(absFilepath, 'utf8'),
                { schema: yamlSchema }
            );

            if (!Array.isArray(doc)) {
                if (doc === undefined) {
                    logWarn(chalk.yellow(`${chalk.bold.yellow("WARN:")} got 'undefined' after the conversion. the document is likely empty.`));

                    return undefined;
                } else {
                    logError(`failed to convert and save an input file: expected an array from parse result, got ${typeof doc}`, {
                        throwErr: true,
                        additional: {
                            dataPathAlias,
                            absFilepath
                        }
                    });
                    throw '' // type guard
                }
            }

            entriesFoundTotal += doc.length;

            return doc;
        } catch (e) {
            if (e instanceof YAMLException) {
                if (e.message.startsWith('unknown tag')) {
                    throw new Error(`failed to convert and save an input file: unknown YAML tag found in file ${absFilepath} \n${e.message}`);
                }
            } else {
                throw e;
            }
        }
    }

    if (dataPath.type === 'file') {
        if (dataPathProjectConvertedAbsPathParsed.ext === '') {
            // if a path doesn't have an extension, it's likely not a path to a file
            logError(`failed to convert and save an input file: given project converted path is likely a directory path, when a file path was expected`, {
                throwErr: true,
                additional: {
                    projectConvertedPath: dataPath.projectConvertedPath
                }
            });
            throw '' // type guard
        } else if (dataPathProjectConvertedAbsPathParsed.ext !== '.json') {
            logError(`failed to convert and save an input file: given project converted path does not in .json`, {
                throwErr: true,
                additional: {
                    projectConvertedPath: dataPath.projectConvertedPath
                }
            });
            throw '' // type guard
        }

        const converted = convertFile(dataPathProjectInputAbsPath);
        if (converted !== undefined) {
            fs.ensureDirSync(path.parse(dataPathProjectConvertedAbsPath).dir);
            fs.writeJsonSync(dataPathProjectConvertedAbsPath, converted, { spaces: 4 });
        }

        filesFoundTotal++;
    } else {
        if (dataPathProjectConvertedAbsPathParsed.ext !== '') {
            logError(`failed to convert and save an input file: given project converted is a filepath, when a directory path was expected`, {
                throwErr: true,
                additional: {
                    projectConvertedPath: dataPath.projectConvertedPath
                }
            });
            throw '' // type guard
        }

        const yamlFiles = getFilesInDirectoryRecursively(dataPathProjectInputAbsPath)
            .filter(file => isFilenameForYamlFile(file.filename))

        for (const [i, { absFilepath, relDirpath, filename, relFilepath }] of yamlFiles.entries()) {
            // logInfo(`${chalk.magenta('▮')} [${i + 1} of ${yamlFiles.length}] converting file: ${chalk.bold(relFilepath)}`)
            // logInfo(chalk.gray(absFilepath));

            const converted = convertFile(absFilepath);

            const convertedSaveFilepath = path.join(dataPathProjectConvertedAbsPath, relDirpath, path.parse(filename).name + '.json');

            if (converted !== undefined) {
                fs.ensureDirSync(path.parse(convertedSaveFilepath).dir);
                fs.writeJsonSync(convertedSaveFilepath, converted, { spaces: 4 });
            }

            filesFoundTotal++;
        }
    }

    if (entriesFoundTotal === 0) {
        logInfo(chalk.yellow("no entries found"))
    } else {
        // logInfo(`${chalk.bold.green('OK')}, done converting ${chalk.underline(entriesFoundTotal)} ${entriesFoundTotal === 1 ? 'entry' : 'entries'} ${filesFoundTotal === 1 ? 'in' : 'across'} ${chalk.underline(filesFoundTotal)} ${filesFoundTotal === 1 ? 'file' : 'files'}`);
    }
}




// do a bit of restructure to organize stuff

// logInfo(`moving "reagents/Materials" into a separate directory... ${chalk.italic("(be aware - this will decrease the number of reagents at later steps)")}`);

// // move materials into a separate dir
// const materialsDirSrcPathRelToProject = path.join(projectPaths.convertedData, 'reagents', 'Materials')
// if (!fs.existsSync(materialsDirSrcPathRelToProject)) {
//     throw new Error("materials dir not found @ path: " + materialsDirSrcPathRelToProject);
// }

// const materialsDirDistPathRelToProject = path.join(projectPaths.convertedData, 'materials')
// fs.moveSync(materialsDirSrcPathRelToProject, materialsDirDistPathRelToProject);