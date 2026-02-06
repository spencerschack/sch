import { join } from "node:path";
import { homedir } from "node:os";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { removeWorktreeConfig } from "../worktree/config.js";
import { closeWindow } from "../window/operations.js";
import { execAsync, exists } from "../utils.js";

export async function removeWorktree(worktreeName: string, force = false): Promise<void> {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const carrotPath = join(homedir(), "carrot");

  if (!(await exists(worktreePath))) {
    console.log(`Worktree directory not found: ${worktreePath}`);
    return;
  }

  try {
    const forceFlag = force ? " --force" : "";
    await execAsync(`git worktree remove${forceFlag} "${worktreePath}"`, { cwd: carrotPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("contains modified or untracked files")) {
      throw new Error("Worktree has uncommitted changes");
    }
    throw error;
  }
}

export async function removeWorktreeFull(worktreeName: string, force = false): Promise<void> {
  await closeWindow(worktreeName);
  await removeWorktree(worktreeName, force);
  await removeWorktreeConfig(worktreeName);
}
