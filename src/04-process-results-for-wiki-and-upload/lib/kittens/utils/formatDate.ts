/**
 * Formats Date as `YYYY-MM-DD HH:MM`.
 */
export function formatDateForCommit(date: Date): string {
    const [dateStr, timeStr] = date.toISOString().split("T");

    let timeStrRes = timeStr.split(".")[0];
    timeStrRes = timeStrRes.split(":").slice(0, 2).join(":");

    return dateStr + " " + timeStrRes;
}

/**
 * Formats Date as `HH-MM DD-MM-YYYY`.
 */
export function formatDateForPrTitle(date: Date): string {
    const [dateStr, timeStr] = date.toISOString().split("T");

    const dateStrRes = dateStr.split("-").reverse().join("-");
    let timeStrRes = timeStr.split(".")[0];
    timeStrRes = timeStrRes.split(":").slice(0, 2).join(":");

    return timeStrRes + " " + dateStrRes;
}

/**
 * Formats Date as `YYYY-MM-DD-HH-MM-SS`.
 */
export function formatDateForBranchName(date: Date): string {
    const [dateStr, timeStr] = date.toISOString().split("T");
    return dateStr + "-" + timeStr.split(".")[0].replaceAll(":", "-");
}