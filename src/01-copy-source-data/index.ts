import { toOsPath } from '$utils/toOsPath';
import { importToProject } from './lib/importToProject';

importToProject(toOsPath("Resources/Locale"), 'locale');
importToProject(toOsPath("Resources/Prototypes"), 'prototype');