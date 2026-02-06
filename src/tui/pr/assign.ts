import type { WorktreeInfo } from "../../worktree/types.js";
import { openUrl } from "../../cli/utils.js";
import type { ActionResult } from "../actions/open.js";

export async function handleAssign(wt: WorktreeInfo): Promise<ActionResult> {
  if (!wt.prUrl || wt.prStatus !== "assign") {
    return { success: false, message: "PR not ready for assignment" };
  }
  await openUrl(wt.prUrl);
  return { success: true, message: `Opened assign: ${wt.name}` };
}
