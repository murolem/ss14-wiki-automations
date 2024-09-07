import { build, InlineConfig, UserConfig, UserConfigFn } from 'vite';
import fs from 'fs';
import viteConfig from '../vite.config';
import { program as argsUtil } from 'commander';
import Logger from '@aliser/logger';
const logger = new Logger('build-task');
const { logDebug, logInfo, logWarn, logError } = logger;

/**
 * This script handles the building of individual source files into resulting
 * scripts in lib mode.
 * 
 * It takes in paths to the source files and invokes the vite build manually.
 * 
 * For watch mode, the script must be run using a concurrent runner. 
 * And only one build source is supported in this mode.
 */

// CONFIGURATION
/** what paths to watch in watch mode */
const pathsToWatch = [
    'src/**',
    './*.ts'
]


// SCRIPT
logInfo('starting build script...');

const sourcesToBuildRelPaths: string[] = [];
argsUtil
    .option('-w', 'watch mode')
    .argument('[source-file-paths...]', 'source file paths')
    .action((sourceFilePaths, options, command) => {
        const result = sourceFilePaths as string[];
        if (result.length === 0) {
            logError('no source file paths specified', { throwErr: true });
        }

        sourcesToBuildRelPaths.push(...result);

    });

const args = argsUtil.parse();
const options = args.opts();
const watchModeEnabled = options['w'];

if (sourcesToBuildRelPaths.length > 1 && watchModeEnabled) {
    logError("cannot build multiple source when in watch mode", { throwErr: true });
}

logInfo(`sources to build (${sourcesToBuildRelPaths.length}): \n` + sourcesToBuildRelPaths.join('\n'));

// check if the source builds paths do exist
const nonExistentPaths = sourcesToBuildRelPaths.filter(filePath => !fs.existsSync(filePath));
if (nonExistentPaths.length > 0) {
    logError('not all sources exist: \n' + nonExistentPaths.join('\n'), { throwErr: true });
}

// ==========

for (const sourceRelPath of sourcesToBuildRelPaths) {
    await runBuild(sourceRelPath);
}

async function runBuild(sourceRelPath: string) {
    const { logInfo, logError } = logger.cloneAndAppendPrefix(sourceRelPath);
    const viteConfig: InlineConfig = getViteConfig(sourceRelPath);
    // this disables vite from getting a config from the project folder,
    // messing up the build process (since we getting the config ourselves).
    viteConfig.configFile = false;

    logInfo('building...');

    if (watchModeEnabled) {
        // if vite config build option is undefined, 
        // create an empty object to hold some values later
        if (!viteConfig.build)
            viteConfig.build = {}

        // enable watch mode
        viteConfig.build!.watch = {
            clearScreen: false,
            include: pathsToWatch
        }

        // run the build indefinitely
        await build(viteConfig)
            .catch(err => logError('error', err, { throwErr: true }));
    } else {
        await build(viteConfig)
            .catch(err => logError('error', err, { throwErr: true }));

        logInfo('build complete!');
    }
}

/**
 * Generates a vite config for the specified build source.
 * @param sourceRelPath build source.
 * @returns vite config.
 */
function getViteConfig(sourceRelPath: string) {
    return (viteConfig as UserConfigFn)({
        mode: sourceRelPath,
        command: 'build'
    }) as UserConfig;
}