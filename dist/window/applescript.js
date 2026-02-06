import { execAsync } from "../utils.js";
export async function runAppleScript(script) {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return stdout.trim();
}
