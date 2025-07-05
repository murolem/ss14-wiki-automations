/*
* Apply processing to final outputs from the main processing steps,
* making it all suitable for wiki usage.
*/

export default async function () {
    (await import("./bunnies/entities")).default();
}