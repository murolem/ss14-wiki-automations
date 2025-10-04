# ss14-wiki-automations

Contains various data export scripts for the [Space Station 14 Wiki](https://wiki.spacestation14.com/wiki/Main_Page).

## About the process

Every hour an action runs that pulls data from the [upstream SS14 repository](https://github.com/space-wizards/space-station-14), process it and uploads any changes to the wiki.

## Developing

The program uses the SS14 upstream repository for all its data gather needs, without building it, straight from the source.

The repository is cloned locally with no history. This might take some time locally, but happens very fast when using actions on github.

The code is divided into steps, with each steps results saved under different location in the temp directory. See [Project structure](#Project structure) for details.

### Project structure

-   `01-copy-source-data` - contains stuffs for copying data from the cloned locally SS14 repo.
-   `02-convert-source-data` - contains stuffs for converting data from the first step into more manageable formats, such as YML to JSON.
-   `03-process-converted-data` - contains stuffs for processing the game data from previous step to an intermediary state consumed by the next step.
-   `04-process-for-wiki-and-upload` - contains stuffs for processing the game data from previous step into a form consumed by the wiki, along with uploading tools to make that happen.
-   `schema` - contains various schema definition and validators used across the project.
-   `preset.ts` - contains program-wide config, though there are smaller configs for some steps/substeps (named `config.ts`/`base.ts`) scattered across the project.

### Commands

Some less obvious command

-   `ss14-repo:clone-no-checkout` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under no specific branch.
-   `ss14-repo:clone-checkout:stable` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under `stable` branch with the depth of 1.
-   `ss14-repo:clone-checkout:master` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under `master` branch with the depth of 1.
-   `sync:clone` - Clones the `sync` branch off of this repo with the depth of 1. The sync branch is used for syncing changes with the wiki.
-   `copy-source-data` - Runs the copy source data step.
-   `convert-source-data` - Runs the convert source data step.
-   `process-converted-data` - Runs the process converted data step.
-   `process-for-wiki-and-upload` - Runs the wiki upload step of the processed data.
-   `process-for-wiki-and-upload:nopr:noupload` - Runs the wiki upload step of the processed data but without making changes the the sync branch and wiki uploads.
-   `start` - Runs type check, tests and all the steps in normal mode. This step is run by the action runner.
-   `start:noclone:nowiki` - Runs all the steps except wiki upload in normal mode without cloing SS14 Upstream repo. The repo is expected to be already cloned locally.
-   `start:noclone` - Runs all the steps except in normal mode without cloing SS14 Upstream repo. The repo is expected to be already cloned locally.
-   `start:nowiki` - Runs all the steps except except wiki upload in normal mode.
