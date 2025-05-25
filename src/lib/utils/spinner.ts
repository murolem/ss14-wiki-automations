import { Logger } from '$logger';
import ora, { type Ora } from 'ora';
const logger = new Logger("spinner");
const { logFatal } = logger;

export class Spinner {
    public initialText?: string;

    private spinner?: Ora;
    private initialized: boolean = false;

    start = (msg: string) => {
        this.spinner = ora();
        this.spinner!.start(msg);
        this.initialText = msg;
        this.initialized = true;
    }

    info = (msg: string): void => {
        this.assertInit();

        this.spinner!.text = msg;
    }

    error = (msg: string, err: any): void => {
        this.assertInit();

        this.spinner!.fail(msg);
        throw err;
    }

    done = (msg: string = "done!"): void => {
        this.assertInit();

        this.spinner!.succeed(msg);
    }

    private assertInit = () => {
        if (!this.initialized) {
            logFatal({
                msg: "spinner not initialized",
                throw: true
            })
            throw ''//guard
        }
    }
}