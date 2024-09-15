import { localizeRecordProperty } from '$src/03-process-converted-data/localizer';
import { processAndSaveConvertedData } from '$src/03-process-converted-data/processAndSaveConvertedData';
import { researchDisciplineValidator } from '$src/schemas/research/discipline';
import { researchTechValidator } from '$src/schemas/research/tech';
import Logger from '@aliser/logger';
const logger = new Logger("03/chunks/research");
const { logInfo, logError, logWarn } = logger;

export default function process() {
    const researchDisciplinesParsed = processAndSaveConvertedData({
        convertedDataPathAlias: 'research.disciplines.parsed',
        outputDataPathAlias: 'research.disciplines.parsed',
        processor({ files, parseFiles, writeToOutput }) {
            const parsedEntries = parseFiles(files, researchDisciplineValidator);

            for (const entry of parsedEntries) {
                // localize in place
                localizeRecordProperty(entry, { property: 'name' });
            }

            writeToOutput(parsedEntries);

            return parsedEntries;
        }
    });

    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'research.disciplines.processed',
        processor({ writeToOutput }) {
            // a record mapping discipline ID → discipline
            const disciplinesByDisciplineId = researchDisciplinesParsed
                .reduce((accum, entry) => {
                    accum[entry.id] = entry;

                    // remove extra fields
                    // @ts-ignore safe if we don't use this one further
                    delete entry.type;
                    // @ts-ignore same as above
                    delete entry.id;

                    return accum;
                }, {} as Record<string, unknown>);

            writeToOutput(disciplinesByDisciplineId);
        }
    });


    const researchTechsParsed = processAndSaveConvertedData({
        convertedDataPathAlias: 'research.techs.parsed',
        outputDataPathAlias: 'research.techs.parsed',
        processor({ files, parseFiles, writeToOutput }) {
            const parsedEntries = parseFiles(files, researchTechValidator);

            for (const entry of parsedEntries) {
                // localize in place
                localizeRecordProperty(entry, { property: 'name' });
            }

            writeToOutput(parsedEntries);

            return parsedEntries;
        }
    });

    processAndSaveConvertedData({
        convertedDataPathAlias: 'noop',
        outputDataPathAlias: 'research.techs.processed',
        processor({ writeToOutput }) {
            // a record mapping discipline ID → tech ID → tech
            const techsByTechIdByDisciplineId = researchTechsParsed
                .reduce((accum, entry) => {
                    // assign to a discipline
                    if (!accum[entry.discipline]) {
                        accum[entry.discipline] = {}
                    }

                    accum[entry.discipline][entry.id] = entry;

                    // remove extra fields
                    // @ts-ignore safe if we don't use this one further
                    delete entry.type;
                    // @ts-ignore same as above
                    delete entry.id;
                    // @ts-ignore same as above
                    delete entry.discipline;

                    return accum;
                }, {} as Record<string, Record<string, unknown>>);

            writeToOutput(techsByTechIdByDisciplineId);
        }
    });
}