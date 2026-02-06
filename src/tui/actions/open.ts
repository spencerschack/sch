import type { WorktreeInfo } from "../../worktree/types.js";
import { openUrl } from "../../cli/utils.js";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function handleOpen(wt: WorktreeInfo): Promise<ActionResult> {
  await openUrl(wt.cursorUrl);
  return { success: true, message: `Opened: ${wt.name}` };
}
