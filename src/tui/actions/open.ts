import type { WorktreeInfo } from "../../worktree/types.js";
import { openAgent } from "../../agent/provider.js";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function handleOpen(wt: WorktreeInfo): Promise<ActionResult> {
  await openAgent(wt.name);
  return { success: true, message: `Opened: ${wt.name}` };
}
