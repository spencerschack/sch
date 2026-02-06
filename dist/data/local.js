import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig } from "../worktree/config.js";
import { exists } from "../utils.js";
import { getBentoCommit } from "../git.js";
import { getAgentStatus } from "../agent/status.js";
import { getGitInfo } from "../status/git.js";
import { getQaStatus } from "../status/qa.js";
export async function fetchLocalWorktreeInfo(entry, bentoCommit) {
    if (entry.startsWith("@"))
        return null;
    const worktreePath = join(WORKTREES_DIR, entry);
    if (!(await stat(worktreePath)).isDirectory())
        return null;
    const [agent, git, config] = await Promise.all([
        getAgentStatus(entry),
        getGitInfo(worktreePath),
        readWorktreeConfig(entry),
    ]);
    const qaStatus = await getQaStatus(worktreePath, config, bentoCommit);
    return {
        name: entry,
        agentProvider: config.agentProvider,
        agent,
        git,
        paused: config.paused ?? false,
        blocked: false, // Computed later in mergeWorktreeData
        dependsOn: config.dependsOn ?? [],
        qaStatus,
    };
}
export async function fetchAllLocalWorktreeInfo() {
    if (!(await exists(WORKTREES_DIR))) {
        return [];
    }
    const [entries, bentoCommit] = await Promise.all([
        readdir(WORKTREES_DIR),
        getBentoCommit(),
    ]);
    const results = await Promise.all(entries.map((entry) => fetchLocalWorktreeInfo(entry, bentoCommit)));
    return results.filter((wt) => wt !== null);
}
