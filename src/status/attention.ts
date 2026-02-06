import type { PrStatus, WorktreeInfo } from "../worktree/types.js";

export function isBusyStatus(status: PrStatus): boolean {
  return status === "loading" || status === "frozen" || status === "running" || status === "queued" || status === "waiting";
}

export function needsAttention(wt: WorktreeInfo): boolean {
  if (wt.paused || wt.blocked) return false;
  if (wt.agent.status === "active") return false;
  if (wt.git.status === "changed") return true;
  return !isBusyStatus(wt.prStatus);
}

export function getPrPriority(status: PrStatus): number {
  switch (status) {
    case "approved": return 1;
    case "assign": return 2;
    case "conflict": return 3;
    case "failed": return 4;
    case "expired": return 5;
    case "frozen": return 6;
    case "none": return 7;
    case "waiting": return 8;
    case "running": return 9;
    case "loading": return 9;
    case "merged": return 10;
    case "queued": return 10;
    case "closed": return 11;
  }
}

export function getStatusPriority(wt: WorktreeInfo): number {
  // Sort order: active (0) > blocked (1) > paused (2)
  if (wt.paused) return 2;
  if (wt.blocked) return 1;
  return 0;
}
