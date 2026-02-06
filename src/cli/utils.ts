import { execAsync } from "../utils.js";

export async function openUrl(url: string): Promise<void> {
  await execAsync(`open "${url}"`);
}
