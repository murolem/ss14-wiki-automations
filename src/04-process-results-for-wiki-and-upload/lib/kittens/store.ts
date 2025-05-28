import { Logger } from '$logger';
import fs from 'fs-extra';
const logger = new Logger("wiki/kittens/store");
const { logFatal } = logger;

// okay IDK how to make this a good solution.
// this works.

const storeJsonPath = "./.cache/wiki-kittens-store.json";

/** A primitive session-wide persistent key-value store configured for kittens. */
const store = new (class {
    constructor() {
        this.load();
    }

    clear() {
        if (fs.existsSync(storeJsonPath)) {
            fs.rmSync(storeJsonPath);
        }
    }

    load() {
        const store = fs.existsSync(storeJsonPath)
            ? fs.readJsonSync(storeJsonPath)
            : {};

        for (const [key, value] of Object.entries(store)) {
            const propDesc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);
            if (propDesc && propDesc.set) {
                // todo add type support if there would be more than 1 field in this.
                // @ts-ignore it works
                this[key] = value;
            }
        }
    }

    save() {
        const propDescs = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this));

        const store = Object.entries(propDescs)
            .reduce((accum, [key, desc]) => {
                if (desc.get) {
                    // @ts-ignore it works
                    accum[key] = this[key];
                }

                return accum;
            }, {} as any)

        fs.ensureFileSync(storeJsonPath);
        fs.writeJsonSync(storeJsonPath, store, { spaces: 4 });
    }

    #prNumber: number = -1;
    get prNumber() { return this.#prNumber; }
    set prNumber(value) { this.#prNumber = value; }
})

export default store;