import { join } from "node:path";
import { homedir } from "node:os";
import { removeWorktreeConfig, WORKTREES_DIR } from "./worktree-config.js";
import { closeWindow } from "./window-management.js";
import { execAsync, exists, isMain } from "./utils.js";

async function removeWorktree(worktreeName: string): Promise<void> {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const carrotPath = join(homedir(), "carrot");

  if (!(await exists(worktreePath))) {
    console.log(`Worktree directory not found: ${worktreePath}`);
    return;
  }

  try {
    await execAsync(`git worktree remove "${worktreePath}"`, { cwd: carrotPath });
    console.log(`Removed worktree: ${worktreeName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("contains modified or untracked files")) {
      console.error(`Worktree has uncommitted changes. Use --force to remove anyway.`);
      throw error;
    }
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const worktreeNames = args.filter((a) => !a.startsWith("--"));

  if (worktreeNames.length === 0) {
    console.error("Usage: npm run worktree-remove <worktree-name> [--force]");
    process.exit(1);
  }

  for (const worktreeName of worktreeNames) {
    console.log(`\nRemoving ${worktreeName}...`);

    const closed = await closeWindow(worktreeName);
    if (closed.length > 0) {
      console.log(`Closed ${closed.length} window(s)`);
    }

    try {
      if (force) {
        const worktreePath = join(WORKTREES_DIR, worktreeName);
        const carrotPath = join(homedir(), "carrot");
        await execAsync(`git worktree remove --force "${worktreePath}"`, { cwd: carrotPath });
        console.log(`Removed worktree: ${worktreeName}`);
      } else {
        await removeWorktree(worktreeName);
      }
    } catch {
      console.error(`Failed to remove worktree: ${worktreeName}`);
      continue;
    }

    const configRemoved = await removeWorktreeConfig(worktreeName);
    if (configRemoved) {
      console.log(`Removed config for: ${worktreeName}`);
    }
  }

  console.log("\nDone.");
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
