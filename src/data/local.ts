import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig } from "../worktree/config.js";
import type { LocalWorktreeInfo } from "../worktree/types.js";
import { exists } from "../utils.js";
import { getBentoCommit } from "../git.js";
import { getAgentStatus } from "../agent/status.js";
import { getGitInfo } from "../status/git.js";
import { getQaStatus } from "../status/qa.js";
import { WORKTREE_CONFIGS } from "../lifecycle/create.js";

function getWorkingDirectory(worktreePath: string, name: string): string {
  // Find matching config based on worktree name prefix
  for (const [base, config] of Object.entries(WORKTREE_CONFIGS)) {
    if (name.startsWith(`${base}-`)) {
      return join(worktreePath, config.workingDir);
    }
  }
  return worktreePath;
}

export async function fetchLocalWorktreeInfo(entry: string, bentoCommit: string): Promise<LocalWorktreeInfo | null> {
  if (entry.startsWith("@")) return null;

  const worktreePath = join(WORKTREES_DIR, entry);
  if (!(await stat(worktreePath)).isDirectory()) return null;

  const [agent, git, config] = await Promise.all([
    getAgentStatus(entry),
    getGitInfo(worktreePath),
    readWorktreeConfig(entry),
  ]);

  const qaStatus = await getQaStatus(worktreePath, config, bentoCommit);
  const workingDir = getWorkingDirectory(worktreePath, entry);
  const cursorUrl = `cursor://file/${workingDir}`;

  return {
    name: entry,
    cursorUrl,
    agent,
    git,
    paused: config.paused ?? false,
    blocked: false, // Computed later in mergeWorktreeData
    dependsOn: config.dependsOn ?? [],
    qaStatus,
  };
}

export async function fetchAllLocalWorktreeInfo(): Promise<LocalWorktreeInfo[]> {
  if (!(await exists(WORKTREES_DIR))) {
    return [];
  }

  const [entries, bentoCommit] = await Promise.all([
    readdir(WORKTREES_DIR),
    getBentoCommit(),
  ]);

  const results = await Promise.all(entries.map((entry) => fetchLocalWorktreeInfo(entry, bentoCommit)));
  return results.filter((wt): wt is LocalWorktreeInfo => wt !== null);
}
