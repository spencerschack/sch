import type { WorktreeInfo } from "../../worktree/types.js";
import { execAsync } from "../../utils.js";
import type { ActionResult } from "../actions/open.js";

export async function handleMerge(wt: WorktreeInfo): Promise<ActionResult> {
  if (wt.dependsOn.length > 0) {
    return { success: false, message: "Cannot merge: has dependencies" };
  }
  if (!wt.prUrl || wt.prStatus !== "approved") {
    return { success: false, message: "PR not approved for merge" };
  }

  try {
    await execAsync(`gh pr merge "${wt.prUrl}"`);
    return { success: true, message: `Merged: ${wt.name}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Failed to merge: ${msg}` };
  }
}
