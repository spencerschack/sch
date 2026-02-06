import { join } from "node:path";
import { exists } from "../utils.js";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { getWorktreeCommit, checkoutCommitInBento } from "../git.js";

export async function main(args: string[] = process.argv.slice(2)) {
  const [worktreeName] = args;

  if (!worktreeName) {
    console.error("Usage: sch test <worktree-name>");
    console.error("");
    console.error("Checks out the worktree's commit in ~/carrot (bento) as a detached HEAD");
    console.error("for QA testing. After testing, use 'sch config <name> qa' to record success.");
    process.exit(1);
  }

  const worktreePath = join(WORKTREES_DIR, worktreeName);

  if (!(await exists(worktreePath))) {
    console.error(`Worktree not found: ${worktreePath}`);
    process.exit(1);
  }

  const commit = await getWorktreeCommit(worktreeName);
  console.log(`Checking out ${worktreeName} (${commit.slice(0, 7)}) in bento...`);

  await checkoutCommitInBento(commit);

  console.log(`Done. Run 'sch config ${worktreeName} qa' after testing to record QA.`);
}
