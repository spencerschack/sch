import type { WorktreeInfo } from "../../worktree/types.js";
import { isBusyStatus } from "../../status/attention.js";

export type HighlightColumn = "agent" | "git" | "qa" | "pr" | "deploy" | null;

export function getHighlightColumn(wt: WorktreeInfo): HighlightColumn {
  // Priority 1: Deploy status for merged PRs
  if (wt.prStatus === "merged") {
    return "deploy";
  }
  // Priority 2: PR issues that block progress
  if (wt.prStatus === "conflict" || wt.prStatus === "failed" || wt.prStatus === "expired" || wt.prStatus === "assign" || wt.prStatus === "frozen") {
    return "pr";
  }
  // Priority 3: Agent needs attention (idle when PR isn't busy)
  if (wt.agent.status === "idle" && !isBusyStatus(wt.prStatus)) {
    return "agent";
  }
  // Priority 4: QA is stale
  if (wt.qaStatus === "stale") {
    return "qa";
  }
  // Priority 5: Uncommitted changes
  if (wt.git.status === "changed") {
    return "git";
  }
  // Priority 6: PR is busy/running (positive status)
  if (wt.prStatus === "loading" || wt.prStatus === "running" || wt.prStatus === "queued" || wt.prStatus === "approved" || wt.prStatus === "waiting") {
    return "pr";
  }
  // Priority 7: Agent is active
  if (wt.agent.status === "active") {
    return "agent";
  }
  // Priority 8: QA is in testing
  if (wt.qaStatus === "testing") {
    return "qa";
  }
  return null;
}
