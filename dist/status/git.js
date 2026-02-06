import { execAsync } from "../utils.js";
export async function getGitInfo(worktreePath) {
    // Use wc -l to count lines instead of buffering the entire output
    const { stdout } = await execAsync(`git -C "${worktreePath}" status --porcelain | wc -l`);
    const count = parseInt(stdout.trim(), 10) || 0;
    return { status: count === 0 ? "clean" : "changed", count };
}
export async function getCurrentCommit(worktreePath) {
    const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
    return stdout.trim();
}
