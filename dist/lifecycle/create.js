import { spawn } from "node:child_process";
import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { writeWorktreeConfig } from "../worktree/config.js";
import { execAsync } from "../utils.js";
export const WORKTREE_CONFIGS = {
    "sage-backend": {
        workingDir: "sage/sage-backend",
        services: ["api.sage-backend.customers"],
        setup: ["script/setup"],
    },
    "sage-fullstack": {
        workingDir: ".",
        services: ["api.sage-backend.customers", "web.instacart.customers"],
        setup: ["cd sage/sage-backend && script/setup", "cd customers/store && script/setup"],
    },
    store: {
        workingDir: "customers/store",
        services: ["web.instacart.customers"],
        setup: ["script/setup"],
    },
    migrations: {
        workingDir: "tools/migrations",
        services: ["migrations.tools"],
        setup: ["bundle install"],
    },
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
    // Run setup commands if defined
    if (config.setup) {
        for (const cmd of config.setup) {
            await runCommand(cmd, workingDir, silent);
        }
    }
    return { worktreeName, branchName, workingDir };
}
