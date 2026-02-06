import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig } from "../worktree/config.js";
import type { RemoteWorktreeInfo, DeployStatus } from "../worktree/types.js";
import { getPrStatus } from "../github/pr.js";
import { fetchDeployStatus } from "../deploy/status.js";
import { WORKTREE_CONFIGS } from "../lifecycle/create.js";

export async function fetchRemoteWorktreeInfo(entry: string): Promise<RemoteWorktreeInfo> {
  const worktreePath = join(WORKTREES_DIR, entry);
  const prResult = await getPrStatus(worktreePath);
  
  let deployStatus: DeployStatus = "none";
  
  // Only fetch deploy status for merged PRs with a commit SHA
  if (prResult.status === "merged" && prResult.commitSha) {
    try {
      const config = await readWorktreeConfig(entry);
      const baseConfig = WORKTREE_CONFIGS[config.base];
      
      if (baseConfig?.service) {
        deployStatus = await fetchDeployStatus(baseConfig.service, prResult.commitSha);
      }
    } catch {
      // Config not found or other error, leave as "none"
    }
  }
  
  return {
    prStatus: prResult.status,
    prUrl: prResult.url,
    assignUrl: prResult.assignUrl,
    commitSha: prResult.commitSha,
    deployStatus,
  };
}

export async function fetchAllRemoteWorktreeInfo(names: string[]): Promise<Map<string, RemoteWorktreeInfo>> {
  const results = await Promise.all(
    names.map(async (name) => {
      const remote = await fetchRemoteWorktreeInfo(name);
      return [name, remote] as const;
    })
  );
  return new Map(results);
}
