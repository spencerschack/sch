import type { WorktreeInfo } from "../../worktree/types.js";
import { openUrl } from "../../cli/utils.js";
import type { ActionResult } from "../actions/open.js";

export async function handleOpenPr(wt: WorktreeInfo): Promise<ActionResult> {
  if (!wt.prUrl) {
    return { success: false, message: "No PR URL available" };
  }
  await openUrl(wt.prUrl);
  return { success: true, message: `Opened PR: ${wt.name}` };
}
