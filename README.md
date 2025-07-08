# ss14-wiki-automations

Contains various data export scripts for the [Space Station 14 Wiki](https://wiki.spacestation14.com/wiki/Main_Page).

## Process

Every hour an action runs that pulls data from the [upstream SS14 repository](https://github.com/space-wizards/space-station-14), process it and uploads any changes to the wiki.

## Developing

The program runs regularly using GitHub actions.

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
