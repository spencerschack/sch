import { spawn } from "node:child_process";
import { join } from "node:path";
import { access, constants } from "node:fs/promises";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { writeWorktreeConfig, type AgentProvider } from "../worktree/config.js";
import { execAsync } from "../utils.js";

export interface WorktreeConfigDef {
  workingDir: string;
  services?: string[];
}

export const WORKTREE_CONFIGS: Record<string, WorktreeConfigDef> = {
  "sage-backend": { workingDir: "sage/sage-backend", services: ["api.sage-backend.customers"] },
  "sage-fullstack": { workingDir: ".", services: ["api.sage-backend.customers", "web.instacart.customers"] },
  store: { workingDir: "customers/store", services: ["web.instacart.customers"] },
  migrations: { workingDir: "tools/migrations", services: ["migrations.tools"] },
  github: { workingDir: ".github" },
};

function runCommand(command: string, cwd: string, silent = false): Promise<string> {
  if (silent) {
    return execAsync(command, { cwd }).then(({ stdout }) => stdout.trim());
  }
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], { cwd, stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) resolve("");
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

export function runSetup(cwd: string, silent = false): Promise<void> {
  return runCommand("script/setup", cwd, silent).then(() => {});
}

export interface CreateWorktreeResult {
  worktreeName: string;
  branchName: string;
  workingDir: string;
}

export interface CreateWorktreeOptions {
  /** The agent provider to use (defaults to "cursor") */
  provider?: AgentProvider;
  /** Use silent mode for setup - no terminal output (for TUI use) */
  silent?: boolean;
}

/**
 * Creates a new worktree and optionally runs setup.
 * @param base - The base worktree type (sage, store, etc.)
 * @param description - The description for the branch name
 * @param options - Creation options
 */
export async function createWorktree(
  base: string,
  description: string,
  options: CreateWorktreeOptions = {}
): Promise<CreateWorktreeResult> {
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
  } catch {
    // script/setup doesn't exist or isn't executable, skip
  }

  return { worktreeName, branchName, workingDir };
}
