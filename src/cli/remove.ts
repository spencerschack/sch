import { join } from "node:path";
import { homedir } from "node:os";
import { isMain, execAsync } from "../utils.js";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { removeWorktreeConfig } from "../worktree/config.js";
import { closeWindow } from "../window/operations.js";
import { removeWorktree } from "../lifecycle/remove.js";

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
