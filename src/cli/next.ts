import { isMain } from "../utils.js";
import { fetchWorktrees } from "../data/merge.js";
import { isDependencyRef } from "../worktree/types.js";
import type { WorktreeInfo } from "../worktree/types.js";
import { needsAttention } from "../status/attention.js";
import { openUrl } from "./utils.js";
import { openAgent } from "../agent/provider.js";

async function main() {
  const worktrees = await fetchWorktrees();

  const first = worktrees.find((row): row is WorktreeInfo => !isDependencyRef(row) && needsAttention(row));

  if (!first) {
    console.log("No worktrees need attention");
    process.exit(0);
  }

  // If needs QA and has a PR, show info instead of opening
  const needsQa = first.qaStatus === "none" || first.qaStatus === "stale";
  if (needsQa && first.prStatus !== "none") {
    console.log(`Needs QA: ${first.name}`);
    console.log(`QA Status: ${first.qaStatus}`);
    console.log(`PR: ${first.prUrl}`);
    process.exit(0);
  }

  // Open PR if available, otherwise open the agent
  if (first.prUrl) {
    await openUrl(first.prUrl);
    console.log(`Opened: ${first.prUrl}`);
  } else {
    await openAgent(first.name);
    console.log(`Opened agent for: ${first.name}`);
  }
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
