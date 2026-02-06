import { spawn } from "node:child_process";
import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { execAsync } from "../utils.js";

interface WorktreeConfigDef {
  workingDir: string;
}

export const WORKTREE_CONFIGS: Record<string, WorktreeConfigDef> = {
  sage: { workingDir: "sage/sage-backend" },
  store: { workingDir: "customers/store" },
  migrations: { workingDir: "tools/migrations" },
  github: { workingDir: ".github" },
};

async function run(command: string, cwd: string): Promise<string> {
  const { stdout } = await execAsync(command, { cwd });
  return stdout.trim();
}

// Uses spawn with stdio: "inherit" to stream setup output in real-time
export async function runSetup(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("script/setup", [], {
      cwd,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`script/setup exited with code ${code}`));
    });
  });
}

export interface CreateWorktreeResult {
  worktreeName: string;
  branchName: string;
  workingDir: string;
}

/**
 * Creates a new worktree without running setup or opening Cursor.
 * Used by the TUI to create worktrees programmatically.
 */
export async function createWorktree(base: string, description: string): Promise<CreateWorktreeResult> {
  const config = WORKTREE_CONFIGS[base];
  if (!config) {
    throw new Error(`Unknown base worktree: ${base}. Available: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
  }

  const baseWorktree = join(WORKTREES_DIR, `@${base}`);
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!githubUsername) {
    throw new Error("GITHUB_USERNAME environment variable is not set");
  }

  const branchName = `${githubUsername}/${base}-${description}`;
  const worktreeName = `${base}-${description}`;
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const workingDir = join(worktreePath, config.workingDir);

  await run("git fetch origin master", baseWorktree);
  await run("git rebase origin/master", baseWorktree);
  await run(`git worktree add -b "${branchName}" "${worktreePath}"`, baseWorktree);

  return { worktreeName, branchName, workingDir };
}
