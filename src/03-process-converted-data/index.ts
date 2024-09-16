import fs from 'fs-extra';
import path from 'path';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
import { deepCloneObjectUsingJson, roundToDigit } from '$src/utils';
import { dataPaths, extendedLogging, projectRelPaths } from '$src/preset';
import { resolveInheritance } from '$src/schemas/utils';
import { researchTechValidator } from '$src/schemas/research/tech';
import { researchDisciplineValidator } from '$src/schemas/research/discipline';
import { localizeRecordProperty } from '$src/03-process-converted-data/localizer';
import { entityDefiningValidator, entityValidator } from '$src/schemas/entities/entity';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { recipeValidator } from '$src/schemas/recipes/recipe';
import { latheCategoryValidator } from '$src/schemas/recipes/lathe';
const logger = new Logger("03-parse-converted-data");
const { logInfo, logError, logWarn } = logger;
import processRecipes from './chunks/recipes';
import processItems from './chunks/items/index.ts';
import processResearch from './chunks/research';
import processReagents from './chunks/items/reagents';

logInfo(chalk.bold("processing converted data"));

if (fs.existsSync(projectRelPaths.outputData)) {
    fs.emptyDirSync(projectRelPaths.outputData);
} else {
    fs.ensureDirSync(projectRelPaths.outputData)
}

// ==============

processItems();
processRecipes();
processResearch();