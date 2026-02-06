import type { WorktreeInfo } from "../../worktree/types.js";
import { isBusyStatus } from "../../status/attention.js";

export type HighlightColumn = "agent" | "git" | "qa" | "pr" | null;

export function getHighlightColumn(wt: WorktreeInfo): HighlightColumn {
  // Priority 1: PR issues that block progress
  if (wt.prStatus === "failed" || wt.prStatus === "expired" || wt.prStatus === "assign" || wt.prStatus === "frozen") {
    return "pr";
  }
  // Priority 2: Agent needs attention (idle when PR isn't busy)
  if (wt.agent.status === "idle" && !isBusyStatus(wt.prStatus)) {
    return "agent";
  }
  // Priority 3: QA is stale
  if (wt.qaStatus === "stale") {
    return "qa";
  }
  // Priority 4: Uncommitted changes
  if (wt.git.status === "changed") {
    return "git";
  }
  // Priority 5: PR is running/queued (positive status)
  if (wt.prStatus === "running" || wt.prStatus === "queued" || wt.prStatus === "approved" || wt.prStatus === "waiting") {
    return "pr";
  }
  // Priority 6: Agent is active
  if (wt.agent.status === "active") {
    return "agent";
  }
  // Priority 7: QA is in testing
  if (wt.qaStatus === "testing") {
    return "qa";
  }
  return null;
}
