import type { PrStatus, WorktreeInfo } from "../worktree/types.js";

export function isBusyStatus(status: PrStatus): boolean {
  return status === "loading" || status === "frozen" || status === "running" || status === "queued" || status === "waiting";
}

export function needsAttention(wt: WorktreeInfo): boolean {
  if (wt.paused || wt.blocked) return false;
  if (wt.git.status === "changed") return true;
  return wt.agent.status !== "active" && !isBusyStatus(wt.prStatus);
}

export function getPrPriority(status: PrStatus): number {
  switch (status) {
    case "approved": return 1;
    case "assign": return 2;
    case "failed": return 3;
    case "expired": return 4;
    case "frozen": return 5;
    case "none": return 6;
    case "waiting": return 7;
    case "running": return 8;
    case "loading": return 8;
    case "merged": return 9;
    case "queued": return 9;
    case "closed": return 10;
  }
}

export function getStatusPriority(wt: WorktreeInfo): number {
  // Sort order: active (0) > blocked (1) > paused (2)
  if (wt.paused) return 2;
  if (wt.blocked) return 1;
  return 0;
}
