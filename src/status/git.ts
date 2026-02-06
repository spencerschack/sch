import { execAsync } from "../utils.js";
import type { GitStatusResult } from "../worktree/types.js";

export async function getGitInfo(worktreePath: string): Promise<GitStatusResult> {
  const { stdout } = await execAsync(`git -C "${worktreePath}" status --porcelain`);
  const output = stdout.trim();
  const count = output ? output.split("\n").length : 0;
  return { status: count === 0 ? "clean" : "changed", count };
}

export async function getCurrentCommit(worktreePath: string): Promise<string> {
  const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
  return stdout.trim();
}
