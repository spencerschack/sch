import { execAsync } from "../utils.js";
export async function openUrl(url) {
    await execAsync(`open "${url}"`);
}
