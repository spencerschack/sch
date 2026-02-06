import type { WorktreeInfo } from "../../worktree-info.js";
import { openUrl } from "../../worktree-status.js";
import type { ActionResult } from "../actions/open.js";

export async function handleAssign(wt: WorktreeInfo): Promise<ActionResult> {
  if (!wt.prUrl || wt.prStatus !== "assign") {
    return { success: false, message: "PR not ready for assignment" };
  }
  await openUrl(wt.prUrl);
  return { success: true, message: `Opened assign: ${wt.name}` };
}
