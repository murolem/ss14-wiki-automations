import fs from 'fs-extra';
import path from 'path';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
import { deepCloneObjectUsingJson, roundToDigit } from '$src/utils';
import { dataPaths, extendedLogging, stepDir } from '$src/preset';
import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance.ts';
import { researchTechValidator } from '$src/schema/research/tech.ts';
import { researchDisciplineValidator } from '$src/schema/research/discipline.ts';
import { localizeRecordProperty } from '$src/03-process-converted-data/lib/localizer.ts';
import { entityDefiningValidator, entityValidator } from '$src/schema/entities/entity.ts';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { recipeValidator } from '$src/schema/recipes/recipe.ts';
import { latheCategoryValidator } from '$src/schema/recipes/lathe.ts';
const logger = new Logger("03-parse-converted-data");
const { logInfo, logError, logWarn } = logger;
import processRecipes from './chunks/recipes.ts';
import processItems from './chunks/items/index.ts';
import processResearch from './chunks/research.ts';
import processReagents from './chunks/items/reagents.ts';

logInfo(chalk.bold("processing converted data"));

if (fs.existsSync(stepDir.outputData)) {
    fs.emptyDirSync(stepDir.outputData);
} else {
    fs.ensureDirSync(stepDir.outputData)
}

// ==============

processItems();
processRecipes();
processResearch();