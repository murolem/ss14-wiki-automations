import type { DataPath, dataPaths } from '$src/preset';
import type { FileEntryFromRecursiveFileFunctions, LastElementOf } from '$src/utils';
import type { z, ZodType } from 'zod';

// extracted here because if fucks up the syntax highlighting of the main file,
// including type suggests.
// yes, my code it that bad and I'm proud that I managed to fuck it up to such a degree.
// and not even a single TS error! truly weh!
export type ProcessAndSaveConvertedDataProcessor<TOptionalReturnType extends unknown> = (args: {
    /** 
     * Data path alias for converted files. 
     * 
     * The same one passed to the parent function.
     * */
    convertedDataPathAlias: keyof typeof dataPaths,

    /**
     * Converted path from the data path.
     */
    convertedDataPath: DataPath,

    /** 
     * Data path alias for output file. 
     * 
     * The same one passed to the parent function.
     * */
    outputDataPathAlias: keyof typeof dataPaths,

    /**
     * Output path from the data path.
     */
    outputDataPath: DataPath,

    /**
     * A list of converted files.
     */
    files: FileEntryFromRecursiveFileFunctions[],

    /**
     * Parses each entry in each file in `files` using a series of Zod validators `entryValidators`.
     * 
     * A single validator will work as expected - validate, throw on errors. 
     * If multiple validators are specified, all validators except the last will work in "filtering" mode, 
     * discarding invalid entries.
     * 
     * @returns A flat array of parsed entries.
     */
    parseFiles<
        TEntryValidator extends ZodType,
        TEntryValidators extends TEntryValidator[],
        TLastEntryValidator extends LastElementOf<TEntryValidators>
    >(
        files: FileEntryFromRecursiveFileFunctions[],
        ...entryValidators: TEntryValidators
    ): Array<z.infer<TLastEntryValidator>>;

    /**
     * Writes `data` to the output path.
     * @param data Data to write.
     * @param options Options.
     */
    writeToOutput(
        data: any,
        options?: Partial<{
            /** 
             * If set, the data will be stringified using JSON.stringify() first. It uses 4 spaces.
             * 
             * @default
             * true
              */
            stringifyJson: boolean
        }>
    ): void,
}) => TOptionalReturnType 