import { spawn } from "node:child_process";
import { join } from "node:path";
import { access, constants } from "node:fs/promises";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { writeWorktreeConfig } from "../worktree/config.js";
import { execAsync } from "../utils.js";
export const WORKTREE_CONFIGS = {
    sage: { workingDir: "sage/sage-backend" },
    store: { workingDir: "customers/store" },
    migrations: { workingDir: "tools/migrations" },
    github: { workingDir: ".github" },
};
function runCommand(command, cwd, silent = false) {
    if (silent) {
        return execAsync(command, { cwd }).then(({ stdout }) => stdout.trim());
    }
    return new Promise((resolve, reject) => {
        const child = spawn(command, [], { cwd, stdio: "inherit", shell: true });
        child.on("close", (code) => {
            if (code === 0)
                resolve("");
            else
                reject(new Error(`${command} exited with code ${code}`));
        });
    });
}
export function runSetup(cwd, silent = false) {
    return runCommand("script/setup", cwd, silent).then(() => { });
}
/**
 * Creates a new worktree and optionally runs setup.
 * @param base - The base worktree type (sage, store, etc.)
 * @param description - The description for the branch name
 * @param options - Creation options
 */
export async function createWorktree(base, description, options = {}) {
    const { provider = "cursor", silent = false } = options;
    const config = WORKTREE_CONFIGS[base];
    if (!config) {
        throw new Error(`Unknown base worktree: ${base}. Available: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
    }
    const baseWorktree = join(WORKTREES_DIR, `@${base}`);
    const githubUsername = process.env.GITHUB_USERNAME;
    if (!githubUsername) {
        throw new Error("GITHUB_USERNAME environment variable is not set");
    }
    const branchName = `${githubUsername}/${description}`;
    const worktreeName = description;
    const worktreePath = join(WORKTREES_DIR, worktreeName);
    const workingDir = join(worktreePath, config.workingDir);
    // Save the worktree config first (before directory exists) to avoid race conditions
    await writeWorktreeConfig(worktreeName, {
        base,
        agentProvider: provider,
    });
    await runCommand("git fetch --quiet origin master", baseWorktree, true);
    await runCommand("git rebase --quiet origin/master", baseWorktree, true);
    await runCommand(`git worktree add -b "${branchName}" "${worktreePath}"`, baseWorktree, true);
    // Run script/setup if it exists
    const setupPath = join(workingDir, "script", "setup");
    try {
        await access(setupPath, constants.X_OK);
        await runSetup(workingDir, silent);
    }
    catch {
        // script/setup doesn't exist or isn't executable, skip
    }
    return { worktreeName, branchName, workingDir };
}
