import type { WorktreeInfo, DisplayRow } from "../../worktree/types.js";
import { isDependencyRef } from "../../worktree/types.js";
import { formatAgentStatus, formatGitStatus } from "../../cli/render-table.js";
import { needsAttention } from "../../status/attention.js";
import { getDependencyStatusSummary } from "../../status/summary.js";

export interface ColumnWidths {
  name: number;
  agent: number;
  git: number;
  qa: number;
  pr: number;
  deploy: number;
}

export interface RowData {
  attention: string;
  name: string;
  agent: string;
  git: string;
  qa: string;
  pr: string;
  deploy: string;
  needsAttention: boolean;
}

function formatDeployStatus(status: WorktreeInfo["deployStatus"]): string {
  switch (status) {
    case "loading":
      return "...";
    case "none":
      return "-";
    case "pending":
      return "pending";
    case "in-progress":
      return "deploying";
    case "succeeded":
      return "deployed";
    case "failed":
      return "failed";
    default:
      return "-";
  }
}

export function getRowData(wt: WorktreeInfo): RowData {
  const wtNeedsAttention = needsAttention(wt);
  const attention = wtNeedsAttention ? "!" : " ";
  const agent = formatAgentStatus(wt.agent);
  const git = formatGitStatus(wt.git);
  const pr = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
  const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
  const deploy = formatDeployStatus(wt.deployStatus);
  return { attention, name: wt.name, agent, git, qa, pr, deploy, needsAttention: wtNeedsAttention };
}

export function computeColumnWidths(data: DisplayRow[]): ColumnWidths {
  const widths: ColumnWidths = {
    name: "Worktree".length,
    agent: "Agent".length,
    git: "Git".length,
    qa: "QA".length,
    pr: "PR".length,
    deploy: "Deploy".length,
  };

  // Build a map for dependency lookups
  const worktreeMap = new Map<string, WorktreeInfo>();
  for (const item of data) {
    if (!isDependencyRef(item)) {
      worktreeMap.set(item.name, item);
    }
  }

  for (const item of data) {
    if (isDependencyRef(item)) {
      // Dependency refs have "└─ name (status)" format
      const depInfo = worktreeMap.get(item.name);
      const { text: statusText } = getDependencyStatusSummary(depInfo);
      // "└─ " (3) + name + " (" (2) + status + ")" (1)
      const fullLength = 3 + item.name.length + 2 + statusText.length + 1;
      widths.name = Math.max(widths.name, fullLength);
      continue;
    }
    const row = getRowData(item);
    widths.name = Math.max(widths.name, row.name.length);
    widths.agent = Math.max(widths.agent, row.agent.length);
    widths.git = Math.max(widths.git, row.git.length);
    widths.qa = Math.max(widths.qa, row.qa.length);
    widths.pr = Math.max(widths.pr, row.pr.length);
    widths.deploy = Math.max(widths.deploy, row.deploy.length);
  }

  return widths;
}
