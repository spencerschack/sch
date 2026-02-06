import { join } from "node:path";
import { homedir } from "node:os";
import { execAsync } from "./utils.js";

const BENTO_DIR = join(homedir(), "carrot");
const WORKTREES_DIR = join(homedir(), "worktrees");

export async function getBentoCommit(): Promise<string> {
  const { stdout } = await execAsync(`git -C "${BENTO_DIR}" rev-parse HEAD`);
  return stdout.trim();
}

export async function getWorktreeCommit(worktreeName: string): Promise<string> {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
  return stdout.trim();
}

export async function checkoutCommitInBento(commit: string): Promise<void> {
  await execAsync(`git -C "${BENTO_DIR}" checkout "${commit}" --detach`);
}
