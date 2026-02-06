import { execAsync } from "../utils.js";
import type { GitStatusResult } from "../worktree/types.js";

export async function getGitInfo(worktreePath: string): Promise<GitStatusResult> {
  // Use wc -l to count lines instead of buffering the entire output
  const { stdout } = await execAsync(`git -C "${worktreePath}" status --porcelain | wc -l`);
  const count = parseInt(stdout.trim(), 10) || 0;
  return { status: count === 0 ? "clean" : "changed", count };
}

export async function getCurrentCommit(worktreePath: string): Promise<string> {
  const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
  return stdout.trim();
}
