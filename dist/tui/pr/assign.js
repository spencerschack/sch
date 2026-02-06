import { openUrl } from "../../cli/utils.js";
export async function handleAssign(wt) {
    if (!wt.assignUrl || wt.prStatus !== "assign") {
        return { success: false, message: "PR not ready for assignment" };
    }
    await openUrl(wt.assignUrl);
    return { success: true, message: `Opened assign: ${wt.name}` };
}
