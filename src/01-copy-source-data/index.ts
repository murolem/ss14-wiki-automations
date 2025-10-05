import { toOsPath } from '$utils/toOsPath';
import { importToProject } from './lib/importToProject';

export default async function () {
    importToProject(toOsPath("Resources/Locale"), 'locale');
    importToProject(toOsPath("Resources/Prototypes"), 'prototype');
}