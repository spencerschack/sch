import { spawn } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import { execAsync, isMain } from "./utils.js";

const WORKTREES_DIR = join(homedir(), "worktrees");

interface WorktreeConfig {
  workingDir: string;
}

const WORKTREE_CONFIGS: Record<string, WorktreeConfig> = {
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

  const config = WORKTREE_CONFIGS[base];
  if (!config) {
    console.error(`Unknown base worktree: ${base}`);
    console.error(`Available: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
    process.exit(1);
  }

  const baseWorktree = join(WORKTREES_DIR, `@${base}`);
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!githubUsername) {
    console.error("GITHUB_USERNAME environment variable is not set");
    process.exit(1);
  }

  const branchName = `${githubUsername}/${base}-${description}`;
  const worktreeName = `${base}-${description}`;
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const workingDir = join(worktreePath, config.workingDir);

  console.log(`Fetching latest master...`);
  await run("git fetch origin master", baseWorktree);

  console.log(`Rebasing @${base} onto origin/master...`);
  await run("git rebase origin/master", baseWorktree);

  console.log(`Creating worktree: ${worktreeName}`);
  await run(`git worktree add -b "${branchName}" "${worktreePath}"`, baseWorktree);

  console.log(`Running script/setup in ${config.workingDir}...`);
  await runSetup(workingDir);

  console.log(`Opening Cursor at ${workingDir}...`);
  await run(`cursor "${workingDir}"`, workingDir);

  console.log(`\nWorktree ready: ${worktreeName}`);
  console.log(`Branch: ${branchName}`);
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
