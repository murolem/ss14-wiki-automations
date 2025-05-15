# ss14-wiki-automations

## Todo

-   Support for both stable and master (current) branch. Hard part - figure out a way to upload these to wiki separately?

## Developing

The program runs regularly using GitHub actions.

The program uses the SS14 upstream repository for all its data gather needs, without building it, straight from the source.

The repository is cloned locally with no history. This might take some time locally (but happens very fast on github servers).

The code is divided into steps, with each steps results saved under different location in the temp directory.

Each step can have substeps, which can vary based on the data.

Steps (_step name - temp dir name - description_):

-   **Copy source data** - `01-source-data` - contains files and directories of interest. Data for each substep is saved into its own directory.
-   **Convert source data** - `02-converted-data` - converts source date from previous step into formats usable by the program. At minimum, it's conversion of all YML files into JSON files.
-   **Process converted data** - `03-processed-data` - processes converted data, generating data files to be used on the wiki uploading step. Each substep can generate intermediary data for analysis and debug, which will be organized into relevant folders.
-   **Upload to the wiki** - `04-wiki-upload` - process the data from previous step one final time, making it ready for wiki usage. Due to the presentational nature of the wiki and potentially partial support for generated data (possibly requiring discarding/transforming some of it), this step is separated from the previous one.

### Copy source data

A list of filepaths is defined for copying.

Each path (being either file or dir path), can be saved into a YML/other dir in the step folder. This is done for ease of conversion to json.

On the next step, every json file in YML directory will be converted to JSON.

### Convert source data

A YML directory from copy step is searched for YML files.

Each found YML file is converted to JSON and saved to the converted directory under the same path.

If YML file is empty (including containing only comments), it's saved as an empty array.

### Process converted data

The main processing step, where things like grouping prototypes, resolving dependencies, etc. are happening.

Intermediary data may be produced (useful for debugging), and final datasets ready for upload.

### Upload to the wiki

Data produced on previous step gets uploaded to the wiki.

Any additional wiki-specific processing can happen here (like removing useless data).

This is the final step.
