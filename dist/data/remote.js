import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig } from "../worktree/config.js";
import { getPrStatus } from "../github/pr.js";
import { fetchDeployStatus } from "../deploy/status.js";
import { WORKTREE_CONFIGS } from "../lifecycle/create.js";
/**
 * Combine multiple deploy statuses into a single status.
 * Priority: failed > pending > in-progress > succeeded > none
 */
function combineDeployStatuses(statuses) {
    if (statuses.length === 0)
        return "none";
    if (statuses.includes("failed"))
        return "failed";
    if (statuses.includes("pending"))
        return "pending";
    if (statuses.includes("in-progress"))
        return "in-progress";
    if (statuses.every(s => s === "succeeded"))
        return "succeeded";
    return "none";
}
export async function fetchRemoteWorktreeInfo(entry) {
    const worktreePath = join(WORKTREES_DIR, entry);
    const prResult = await getPrStatus(worktreePath);
    let deployStatus = "none";
    // Only fetch deploy status for merged PRs with a commit SHA
    if (prResult.status === "merged" && prResult.commitSha) {
        try {
            const config = await readWorktreeConfig(entry);
            const baseConfig = WORKTREE_CONFIGS[config.base];
            if (baseConfig?.services && baseConfig.services.length > 0) {
                const statuses = await Promise.all(baseConfig.services.map(service => fetchDeployStatus(service, prResult.commitSha)));
                deployStatus = combineDeployStatuses(statuses);
            }
        }
        catch {
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
export async function fetchAllRemoteWorktreeInfo(names) {
    const results = await Promise.all(names.map(async (name) => {
        const remote = await fetchRemoteWorktreeInfo(name);
        return [name, remote];
    }));
    return new Map(results);
}
