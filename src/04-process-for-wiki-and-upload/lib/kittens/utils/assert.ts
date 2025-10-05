import { Logger } from '$logger';
const logger = new Logger("wiki/kittens/utils/assert");
const { logFatalAndThrow } = logger;

export function assertOkStatusCode(code: number, responseData: unknown, errMessage?: string): void {
    if (!isOkStatusCode(code)) {
        logFatalAndThrow({
            msg: errMessage ?? "assert OK status code failed: check the response data more info",
            data: responseData,
            stringifyData: true
        });
    }
}

export function isOkStatusCode(code: number): boolean {
    return code.toString().startsWith("2");
}