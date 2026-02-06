import { removeWorktreeFull } from "../../lifecycle/remove.js";
export async function handleDelete(wt) {
    try {
        await removeWorktreeFull(wt.name);
        return { success: true, message: `Removed: ${wt.name}` };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Failed to remove: ${msg}` };
    }
}
