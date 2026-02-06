import { openAgent } from "../../agent/provider.js";
export async function handleOpen(wt) {
    await openAgent(wt.name);
    return { success: true, message: `Opened: ${wt.name}` };
}
