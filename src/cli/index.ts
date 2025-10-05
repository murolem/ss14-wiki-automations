import { Command, program } from '@commander-js/extra-typings';
import { Logger } from '$logger';
import StepCopySource from '$src/01-copy-source-data';
import StepConvertSource from '$src/02-convert-source-data';
import StepProcessConverted from '$src/03-process-converted-data';
import StepWikiUpload from '$src/04-process-for-wiki-and-upload';

function withWikiUploadStepOptions<T extends Command>(command: T) {
    return command
        .option("--no-pr", "Disables creation and push of a PR into the sync branch.")
        .option("--no-upload", "Disables upload of any changes to the wiki.")
        .option("--dry", "Alias for --no-pr and --no-upload.")
}

const generalOpts = program
    .name("ss14-wiki-automations")
    .description("Automation utils for the SS14 wiki.")
    .option("-v", "Enables verbose logging.")
    .opts();

withWikiUploadStepOptions(
    program.command("all")
        .description("Runs all steps.")
)
    .action(async (opts) => {
        if (generalOpts.v)
            Logger.setLogLevel('DEBUG');

        await StepCopySource();
        await StepConvertSource();
        await StepProcessConverted();
        await StepWikiUpload({
            createPr: opts.dry ? false : opts.pr,
            uploadToWiki: opts.dry ? false : opts.upload
        });
    });

program.command("copy-source")
    .alias("1")
    .description("Makes a copy of source data to pass to later steps. The source data is expected to be cloned into the temporary folder.")
    .action(async () => {
        if (generalOpts.v)
            Logger.setLogLevel('DEBUG');

        await StepCopySource();
    });

program.command("convert-source")
    .alias("2")
    .description("Converts copied source data into a consumable format.")
    .action(async () => {
        if (generalOpts.v)
            Logger.setLogLevel('DEBUG');

        await StepConvertSource();
    });

program.command("process-converted")
    .alias("3")
    .description("Processed converted data.")
    .action(async () => {
        if (generalOpts.v)
            Logger.setLogLevel('DEBUG');

        await StepProcessConverted();;
    });

withWikiUploadStepOptions(
    program.command("wiki-upload")
        .alias("4")
        .description("Final wiki processing and upload.")
)
    .action(async (opts) => {
        if (generalOpts.v)
            Logger.setLogLevel('DEBUG');

        await StepWikiUpload({
            createPr: opts.dry ? false : opts.pr,
            uploadToWiki: opts.dry ? false : opts.upload
        });
    });

program.parse();