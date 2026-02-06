import type { WorktreeInfo } from "../../worktree/types.js";
import { readWorktreeConfig, writeWorktreeConfig } from "../../worktree/config.js";
import { getBentoCommit, getWorktreeCommit, checkoutCommitInBento } from "../../git.js";

export interface QaResult {
  success: boolean;
  message: string;
  checkedOut?: boolean;
}

export async function handleQa(wt: WorktreeInfo): Promise<QaResult> {
  try {
    // If QA is already done, toggle it off
    if (wt.qaStatus === "done") {
      const config = await readWorktreeConfig(wt.name);
      delete config.qaCommit;
      await writeWorktreeConfig(wt.name, config);
      return { success: true, message: `${wt.name}: QA cleared` };
    }

    const [worktreeCommit, bentoCommit] = await Promise.all([
      getWorktreeCommit(wt.name),
      getBentoCommit(),
    ]);

    if (worktreeCommit !== bentoCommit) {
      await checkoutCommitInBento(worktreeCommit);
      return { success: true, message: "Checking out in bento...", checkedOut: true };
    }

    const config = await readWorktreeConfig(wt.name);
    config.qaCommit = worktreeCommit;
    await writeWorktreeConfig(wt.name, config);
    return { success: true, message: `${wt.name}: QA recorded` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `QA failed: ${msg}` };
  }
}
