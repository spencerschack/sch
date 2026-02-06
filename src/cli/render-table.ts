import prettyMs from "pretty-ms";
import type { AgentStatusResult, GitStatusResult, DisplayRow, WorktreeInfo } from "../worktree/types.js";
import { isDependencyRef } from "../worktree/types.js";
import { needsAttention } from "../status/attention.js";
import { getWorktreeWorkingDir } from "../agent/provider.js";

export function formatAgentStatus(agent: AgentStatusResult): string {
  if (agent.status === "none") return "-";
  if (agent.status === "active") return "active";
  const formatted = prettyMs(agent.age * 1000, { compact: true });
  return `idle ${formatted}`;
}

export function formatGitStatus(git: GitStatusResult): string {
  return git.status === "clean" ? "clean" : `${git.count} changed`;
}

async function getWorktreeUrl(wt: WorktreeInfo): Promise<string> {
  // For cursor provider, use cursor:// URL scheme
  // For TMUX-based providers, just use the working directory path
  const workingDir = await getWorktreeWorkingDir(wt.name);
  if (wt.agentProvider === "cursor") {
    return `cursor://file/${workingDir}`;
  }
  // For CLI providers, link to the working directory
  return workingDir;
}

export async function renderWorktreeTable(rows: DisplayRow[]): Promise<void> {
  console.log("| | Worktree | Agent | Git | QA | PR |");
  console.log("| --- | --- | --- | --- | --- | --- |");

  for (const row of rows) {
    if (isDependencyRef(row)) {
      // Dependency ref - just show the name with indent
      console.log(`|  | └─ ${row.name} |  |  |  |  |`);
      continue;
    }
    const wt = row;
    const attention = needsAttention(wt) ? "!" : "";
    const url = await getWorktreeUrl(wt);
    const nameLink = `[${wt.name}](${url})`;
    const agentDisplay = formatAgentStatus(wt.agent);
    const prLabel = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
    const prStatusDisplay = wt.prUrl ? `[${prLabel}](${wt.prUrl})` : prLabel;
    const qaDisplay = wt.qaStatus === "none" ? "-" : wt.qaStatus;
    console.log(`| ${attention} | ${nameLink} | ${agentDisplay} | ${formatGitStatus(wt.git)} | ${qaDisplay} | ${prStatusDisplay} |`);
  }
}
