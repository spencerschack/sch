import { execAsync } from "../utils.js";

export async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  return stdout.trim();
}
