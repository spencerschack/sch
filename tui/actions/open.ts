import type { WorktreeInfo } from "../../worktree-info.js";
import { openUrl } from "../../worktree-status.js";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function handleOpen(wt: WorktreeInfo): Promise<ActionResult> {
  await openUrl(wt.cursorUrl);
  return { success: true, message: `Opened: ${wt.name}` };
}
