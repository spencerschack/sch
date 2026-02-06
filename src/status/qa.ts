import type { QaStatus } from "../worktree/types.js";
import type { WorktreeConfig } from "../worktree/config.js";
import { getCurrentCommit } from "./git.js";

export async function getQaStatus(
  worktreePath: string,
  config: WorktreeConfig,
  bentoCommit: string
): Promise<QaStatus> {
  const currentCommit = await getCurrentCommit(worktreePath);

  // If QA was recorded at the current commit, it's done
  if (config.qaCommit === currentCommit) return "done";

  // If this worktree's commit is checked out in bento, it's being tested
  if (currentCommit === bentoCommit) return "testing";

  // If QA was recorded but at a different commit
  if (config.qaCommit) return "stale";

  return "none";
}
