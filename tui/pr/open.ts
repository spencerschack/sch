import type { WorktreeInfo } from "../../worktree-info.js";
import { openUrl } from "../../worktree-status.js";
import type { ActionResult } from "../actions/open.js";

export async function handleOpenPr(wt: WorktreeInfo): Promise<ActionResult> {
  if (!wt.prUrl) {
    return { success: false, message: "No PR URL available" };
  }
  await openUrl(wt.prUrl);
  return { success: true, message: `Opened PR: ${wt.name}` };
}
