import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { getPrStatus } from "../github/pr.js";
export async function fetchRemoteWorktreeInfo(entry) {
    const worktreePath = join(WORKTREES_DIR, entry);
    const prResult = await getPrStatus(worktreePath);
    return {
        prStatus: prResult.status,
        prUrl: prResult.url,
        assignUrl: prResult.assignUrl,
    };
}
export async function fetchAllRemoteWorktreeInfo(names) {
    const results = await Promise.all(names.map(async (name) => {
        const remote = await fetchRemoteWorktreeInfo(name);
        return [name, remote];
    }));
    return new Map(results);
}
