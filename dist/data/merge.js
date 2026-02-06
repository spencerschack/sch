import { readdir } from "node:fs/promises";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { exists } from "../utils.js";
import { getBentoCommit } from "../git.js";
import { needsAttention, getPrPriority, getStatusPriority } from "../status/attention.js";
import { fetchLocalWorktreeInfo } from "./local.js";
import { fetchRemoteWorktreeInfo } from "./remote.js";
export function mergeWorktreeData(local, remote) {
    const localByName = new Map(local.map((l) => [l.name, l]));
    return local.map((l) => {
        const r = remote.get(l.name) ?? { prStatus: "loading", prUrl: null, assignUrl: null, commitSha: null, deployStatus: "loading" };
        // Compute blocked status based on dependencies
        // Blocked if ANY dependency exists and its PR is not merged
        let blocked = false;
        for (const dep of l.dependsOn) {
            const depExists = localByName.has(dep);
            if (depExists) {
                const depRemote = remote.get(dep);
                if (depRemote?.prStatus !== "merged") {
                    blocked = true;
                    break;
                }
            }
        }
        return { ...l, ...r, blocked };
    });
}
export function sortWorktrees(worktrees) {
    // Sort all worktrees: active > blocked > paused, then by attention/PR status
    const sorted = [...worktrees].sort((a, b) => {
        const aPriority = getStatusPriority(a);
        const bPriority = getStatusPriority(b);
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        const aNeedsAttention = needsAttention(a);
        const bNeedsAttention = needsAttention(b);
        if (aNeedsAttention !== bNeedsAttention) {
            return aNeedsAttention ? -1 : 1;
        }
        return getPrPriority(a.prStatus) - getPrPriority(b.prStatus);
    });
    // Insert dependency refs after worktrees that have dependencies
    const result = [];
    for (const wt of sorted) {
        result.push(wt);
        // Add dependency refs for each dependency
        for (const dep of wt.dependsOn) {
            result.push({
                type: "dependency",
                name: dep,
                dependentName: wt.name,
            });
        }
    }
    return result;
}
export async function processWorktree(entry, bentoCommit) {
    const local = await fetchLocalWorktreeInfo(entry, bentoCommit);
    if (!local)
        return null;
    const remote = await fetchRemoteWorktreeInfo(entry);
    return { ...local, ...remote };
}
export async function fetchWorktrees() {
    if (!(await exists(WORKTREES_DIR))) {
        return [];
    }
    const [entries, bentoCommit] = await Promise.all([
        readdir(WORKTREES_DIR),
        getBentoCommit(),
    ]);
    const results = await Promise.all(entries.map((entry) => processWorktree(entry, bentoCommit)));
    const worktrees = results.filter((wt) => wt !== null);
    return sortWorktrees(worktrees);
}
