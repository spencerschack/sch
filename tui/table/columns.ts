import type { WorktreeInfo, DisplayRow } from "../../worktree-info.js";
import { isDependencyRef } from "../../worktree-info.js";
import { formatAgentStatus, formatGitStatus, needsAttention } from "../../render-table.js";

export interface ColumnWidths {
  name: number;
  agent: number;
  git: number;
  qa: number;
  pr: number;
}

export interface RowData {
  attention: string;
  name: string;
  agent: string;
  git: string;
  qa: string;
  pr: string;
  needsAttention: boolean;
}

export function getRowData(wt: WorktreeInfo): RowData {
  const wtNeedsAttention = needsAttention(wt);
  const attention = wtNeedsAttention ? "!" : " ";
  const agent = formatAgentStatus(wt.agent);
  const git = formatGitStatus(wt.git);
  const pr = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
  const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
  return { attention, name: wt.name, agent, git, qa, pr, needsAttention: wtNeedsAttention };
}

export function computeColumnWidths(data: DisplayRow[]): ColumnWidths {
  const widths: ColumnWidths = {
    name: "Worktree".length,
    agent: "Agent".length,
    git: "Git".length,
    qa: "QA".length,
    pr: "PR".length,
  };

  for (const item of data) {
    if (isDependencyRef(item)) {
      // Dependency refs have "└─ " prefix (3 chars)
      widths.name = Math.max(widths.name, 3 + item.name.length);
      continue;
    }
    const row = getRowData(item);
    widths.name = Math.max(widths.name, row.name.length);
    widths.agent = Math.max(widths.agent, row.agent.length);
    widths.git = Math.max(widths.git, row.git.length);
    widths.qa = Math.max(widths.qa, row.qa.length);
    widths.pr = Math.max(widths.pr, row.pr.length);
  }

  return widths;
}
