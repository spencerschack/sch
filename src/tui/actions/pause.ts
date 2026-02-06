import type { WorktreeInfo } from "../../worktree/types.js";
import { readWorktreeConfig, writeWorktreeConfig } from "../../worktree/config.js";
import type { ActionResult } from "./open.js";

export async function handlePause(wt: WorktreeInfo): Promise<ActionResult> {
  const config = await readWorktreeConfig(wt.name);
  config.paused = !config.paused;
  await writeWorktreeConfig(wt.name, config);
  return { success: true, message: `${wt.name}: ${config.paused ? "paused" : "unpaused"}` };
}
