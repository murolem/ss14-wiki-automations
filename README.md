# ss14-wiki-automations

Contains various data export scripts for the [Space Station 14 Wiki](https://wiki.spacestation14.com/wiki/Main_Page).

## About the process

Every hour an action runs that pulls data from the [upstream SS14 repository](https://github.com/space-wizards/space-station-14), process it and uploads any changes to the wiki.

The master branch is used for the data pulling (i.e. the latest changes that are on Vulture).

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

    "type-check": "tsc",
    "test": "vitest --run",
    "test:watch": "vitest",
    "clone-upstream:no-fetch": "rimraf temp && mkdir temp && cd temp && mkdir _ss14-repo && cd _ss14-repo && git init && git remote add origin https://github.com/space-wizards/space-station-14.git && git sparse-checkout init && git sparse-checkout set Resources/",
    "clone-upstream:stable": "bun run clone-upstream:no-fetch && cd temp && cd _ss14-repo && git fetch --depth=1 origin stable && git checkout stable",
    "clone-upstream:master": "bun run clone-upstream:no-fetch && cd temp && cd _ss14-repo && git fetch --depth=1 origin master && git checkout master",
    "clone-sync": "mkdir temp && cd temp && rimraf temp _sync && mkdir _sync && cd _sync && git init && git remote add origin https://github.com/murolem/ss14-wiki-automations.git && git fetch --depth=1 origin sync && git checkout sync",
    "start": "bun run type-check && bun run test && bun run clone-upstream:master && bun run start:cli",
    "start:cli": "bun --env-file=.env src/cli/index.ts"

-   `clone-upstream:no-fetch` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under no specific branch.
-   `clone-upstream:stable` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under `stable` branch with the depth of 1.
-   `clone-upstream:master` - Clones the SS14 Upstream repo with sparse-checkout Resources dir under `master` branch with the depth of 1.
-   `clone-sync` - Clones the `sync` branch off of this repo with the depth of 1. The sync branch is used for syncing changes with the wiki.
-   `start` - Runs everything.
-   `start:cli` - CLI entrypoint that can run any/all of the four steps. Type --help to see available commands.
