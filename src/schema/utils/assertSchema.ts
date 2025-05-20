import { ZodError, type z, type ZodType } from 'zod';
import { fromError } from 'zod-validation-error';
import { Logger } from '$logger';
const logger = new Logger("schema/utils/assertSchema");
const { logFatal } = logger;

/** 
 * Attempts to parse `data` using `schema`.
 * 
 * If successful, returns parsed data. 
 * If not, throws an error with the passed data and the error message.
 * 
 * This function is just a wrapper around Zod .parse, 
 * making error messages more readable and also logging the erroneous data alongside.
 * 
 */
export function schemaParse<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
    try {
        return schema.parse(data);
    } catch (err) {
        if (err instanceof ZodError) {
            logFatal({
                msg: fromError(err).toString(),
                throw: true,
                data
            });
        } else {
            logFatal({
                msg: "unknown error while parsing",
                throw: true,
                data
            });
        }
    }
}