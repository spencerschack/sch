import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";
const execPromise = promisify(exec);
// Wrapper with larger buffer to avoid ERR_CHILD_PROCESS_STDIO_MAXBUFFER
export function execAsync(command, options) {
    return execPromise(command, { maxBuffer: 50 * 1024 * 1024, ...options });
}
export async function exists(path) {
    try {
        await stat(path);
        return true;
    }
    catch {
        return false;
    }
}
export function isMain(importMetaUrl) {
    return process.argv[1] === fileURLToPath(importMetaUrl);
}
