import { openUrl } from "../../cli/utils.js";
export async function handleOpenPr(wt) {
    if (!wt.prUrl) {
        return { success: false, message: "No PR URL available" };
    }
    await openUrl(wt.prUrl);
    return { success: true, message: `Opened PR: ${wt.name}` };
}
