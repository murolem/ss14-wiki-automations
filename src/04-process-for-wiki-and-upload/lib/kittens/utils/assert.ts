import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/utils/assert");
const { logFatal } = logger;

export function assertOkStatusCode(code: number, responseData: unknown, errMessage?: string): void {
    if (!isOkStatusCode(code)) {
        logFatal({
            msg: errMessage ?? "assert OK status code failed: check the response data more info",
            throw: true,
            data: responseData,
            stringifyData: true
        });
    }
}

export function isOkStatusCode(code: number): boolean {
    return code.toString().startsWith("2");
}