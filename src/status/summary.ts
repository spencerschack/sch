import type { WorktreeInfo, PrStatus, DeployStatus } from "../worktree/types.js";

export interface StatusSummary {
  text: string;
  type: "pr" | "deploy" | "missing";
}

/**
 * Get a single-word summary of a dependency's status.
 * Prioritizes deploy status for merged PRs, otherwise shows PR status.
 */
export function getDependencyStatusSummary(depInfo: WorktreeInfo | undefined): StatusSummary {
  if (!depInfo) {
    return { text: "missing", type: "missing" };
  }
  
  // For merged PRs, show deploy status if available
  if (depInfo.prStatus === "merged") {
    const deployText = formatDeployStatusText(depInfo.deployStatus);
    if (deployText) {
      return { text: deployText, type: "deploy" };
    }
    return { text: "merged", type: "pr" };
  }
  
  return { text: formatPrStatusText(depInfo.prStatus), type: "pr" };
}

function formatPrStatusText(status: PrStatus): string {
  switch (status) {
    case "loading":
      return "...";
    case "none":
      return "no pr";
    case "closed":
      return "closed";
    default:
      return status;
  }
}

function formatDeployStatusText(status: DeployStatus): string | null {
  switch (status) {
    case "loading":
      return "...";
    case "succeeded":
      return "deployed";
    case "in-progress":
      return "deploying";
    case "pending":
      return "pending";
    case "failed":
      return "deploy failed";
    case "none":
      return null; // Fall back to PR status
    default:
      return null;
  }
}
