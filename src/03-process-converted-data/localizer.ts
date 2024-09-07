import { dataPaths, preferredLocale, projectRelPaths } from '$src/preset';
import { getFilesInDirectoryRecursively } from '$src/utils';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import path from 'path';
import fs from 'fs-extra';
import Logger from '@aliser/logger';
import chalk from 'chalk';
import { z } from 'zod';
const logger = new Logger("03/localizer");
const { logInfo, logError } = logger;

/*
 * Setups the FTL localizator function based on the language code set in the preset,
 * consuming all FTL files inside the locale dir in the imported files.
 */

const localeFiles = getFilesInDirectoryRecursively(path.join(projectRelPaths.inputData, dataPaths.locale.projectInputPath));

const localization = new FluentBundle(preferredLocale);
for (const { absFilepath } of localeFiles) {
    const resource = new FluentResource(fs.readFileSync(absFilepath).toString());
    localization.addResource(resource);
}

/**
 * Returns a localized string for a given key.
 * @param key Localized string key.
 * @throws Error if no localized string is defined with a given key.
 */
export function lookupLocalizedStringByKey(key: string): string {
    if (!localization.hasMessage(key)) {
        logError(`failed to localize: no localized string was found by key ${chalk.bold(key)}'`, {
            throwErr: true
        });
        throw ''//type guard
    }

    const messageObj = localization.getMessage(key)!;

    const valuePattern = messageObj.value;
    if (!valuePattern) {
        logError(`failed to localize: value pattern is null for key key ${chalk.bold(key)}'`, {
            throwErr: true,
            additional: {
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
    return z.string({ message: `localizer assertion failed: localization key '${key}' is not a string` })
        .parse(key);
}

/**
 * Localizes a record property by key (for shallow properties), 
 * or uses a given getter/setter function to localize properties on deeper level.
 */
export function localizeRecordProperty<
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
    if (property === undefined && getterSetter === undefined) {
        logError(`record property localizer failed: both 'property' and 'getterSetter' args are undefined`, {
            throwErr: true
        });
        throw '' // type guard
    } else if (property !== undefined && getterSetter !== undefined) {
        logError(`record property localizer failed: 'property' and 'getterSetter' args are both defined`, {
            throwErr: true
        });
        throw '' // type guard
    }

    if (property !== undefined) {
        const key = assertLocalizationKeyIsString(doc[property]);

        // @ts-ignore the prop is already validated to be a string
        doc[property] = lookupLocalizedStringByKey(key);
    } else {
        getterSetter!.setter(doc, getterSetter!.getter(doc));
    }
}