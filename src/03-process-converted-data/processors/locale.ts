import { preferredLocale, projectStepDirpaths } from '$src/preset';
import chalk from 'chalk';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import fs from 'fs-extra';
import { assertPathExists, getFilesInDirectoryRecursively } from '$src/utils';
import { Logger } from '$logger';
import { z } from 'zod';
import { generateProcessorRunner } from '$src/lib/shared/projectProcessor';
const logger = new Logger("process/processors/locale");
const { logInfo, logFatal } = logger;

let loaded = false;

const localization = new FluentBundle(preferredLocale);

export default generateProcessorRunner(
    'locale',
    'processed',
    'processed_temp',
    ({
        project,
        projectDirpath,
        step,
        tempStep,
        outputDirpath,
        tempDirpath,
        stepDirpaths,
        logger,
        writeJsonSync,
    }) => {
        const { logDebug, logInfo, logFatal } = logger;

        const localeDirPath = projectStepDirpaths.locale.input;
        logInfo(`loading locale for the first time; from: ${chalk.bold(localeDirPath)}`);
        assertPathExists(localeDirPath);

        const localeFiles = getFilesInDirectoryRecursively(localeDirPath);
        let totalStrings = 0;
        for (const { absFilepath } of localeFiles) {
            const resource = new FluentResource(fs.readFileSync(absFilepath).toString());
            localization.addResource(resource);

            totalStrings += resource.body.length;
        }

        logInfo(`locale loaded; preferred locale ${chalk.bold(preferredLocale)}'; total strings: ${chalk.bold(totalStrings)}`);

        loaded = true;
    });


/**
 * Lookups a localized string for a given key.
 * @param key Localized string key.
 * @throws Error if no localized string is defined with a given key.
 */
export function loc(key: string): string {
    assertLoaded();

    if (!localization.hasMessage(key)) {
        logFatal({
            msg: `failed to lookup a locale string: unknown key ${chalk.bold(key)}`,
            throw: true
        });
        throw ''//type guard
    }

    const messageObj = localization.getMessage(key)!;

    const valuePattern = messageObj.value;
    if (!valuePattern) {
        logFatal({
            msg: `failed to lookup a locale string: null value for key ${chalk.bold(key)}`,
            throw: true,
            data: {
                messageObj
            }
        });
        throw ''//type guard
    }

    const valueString = localization.formatPattern(valuePattern);

    return valueString;
}

/** Asserts that a given key is a string and returns it. */
function assertLocalizationKeyIsString(key: unknown): string {
    return z.string({
        message: `locale key is string assertion failed: localization key ${chalk.bold(key)} is not a string`
    })
        .parse(key);
}

/**
 * Localizes a record property by key (for shallow properties), 
 * or uses a given getter/setter function to localize properties on deeper level.
 * 
 * @throws Error if no localization key was found. This is only for when `property` was set.
 */
export function locRecordProperty<
    TDoc extends Record<string, unknown>
>(
    doc: TDoc,
    {
        property,
        getterSetter
    }: {
        property?: keyof TDoc,
        getterSetter?: {
            getter: (doc: TDoc) => string,
            setter: (doc: TDoc, value: string) => void
        }
    }
): void {
    assertLoaded();

    if (property === undefined && getterSetter === undefined) {
        logFatal({
            msg: `record property localizer failed: both 'property' and 'getterSetter' args are undefined`,
            throw: true
        });
        throw '' // type guard
    } else if (property !== undefined && getterSetter !== undefined) {
        logFatal({
            msg: `record property localizer failed: 'property' and 'getterSetter' args are both defined`,
            throw: true
        });
        throw '' // type guard
    }

    if (property !== undefined) {
        const key = assertLocalizationKeyIsString(doc[property]);

        // @ts-ignore the prop is already validated to be a string
        doc[property] = loc(key);
    } else {
        getterSetter!.setter(doc, getterSetter!.getter(doc));
    }
}

/**
 * Checks whether a locale has been loaded.
 * 
 * @throws {Error} If no locale has been loaded yet.
 */
function assertLoaded() {
    if (!loaded) {
        logFatal({
            msg: `locale loaded assertion failed: locale not loaded`,
            throw: true
        });
    }
}