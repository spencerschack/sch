import type { WorktreeInfo } from "../../worktree/types.js";
import { openUrl } from "../../cli/utils.js";
import type { ActionResult } from "../actions/open.js";

export async function handleAssign(wt: WorktreeInfo): Promise<ActionResult> {
  if (!wt.assignUrl || wt.prStatus !== "assign") {
    return { success: false, message: "PR not ready for assignment" };
  }
  await openUrl(wt.assignUrl);
  return { success: true, message: `Opened assign: ${wt.name}` };
}
