import { spawn } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import { execAsync, isMain } from "./utils.js";

export const WORKTREES_DIR = join(homedir(), "worktrees");

interface WorktreeConfig {
  workingDir: string;
}

export const WORKTREE_CONFIGS: Record<string, WorktreeConfig> = {
  sage: { workingDir: "sage/sage-backend" },
  store: { workingDir: "customers/store" },
};

async function run(command: string, cwd: string): Promise<string> {
  const { stdout } = await execAsync(command, { cwd });
  return stdout.trim();
}

// Uses spawn with stdio: "inherit" to stream setup output in real-time
async function runSetup(cwd: string): Promise<void> {
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: npm run worktree-new <base> <description>");
    console.error("  base: sage, store");
    console.error("  description: kebab-case description for the branch");
    console.error("");
    console.error("Example: npm run worktree-new sage test-create-recipe-tool");
    process.exit(1);
  }

  const [base, ...descParts] = args;
  const description = descParts.join("-");

  console.log(`Fetching latest master...`);
  console.log(`Rebasing @${base} onto origin/master...`);
  console.log(`Creating worktree...`);

  const result = await createWorktree(base, description);

  console.log(`Running script/setup in ${WORKTREE_CONFIGS[base].workingDir}...`);
  await runSetup(result.workingDir);

  console.log(`Opening Cursor at ${result.workingDir}...`);
  await run(`cursor "${result.workingDir}"`, result.workingDir);

  console.log(`\nWorktree ready: ${result.worktreeName}`);
  console.log(`Branch: ${result.branchName}`);
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
