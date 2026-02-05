import prettyMs from "pretty-ms";
import type { AgentStatusResult, GitStatusResult, PrStatus, WorktreeInfo, DisplayRow } from "./worktree-info.js";
import { isDependencyRef } from "./worktree-info.js";

export function formatAgentStatus(agent: AgentStatusResult): string {
  if (agent.status === "none") return "-";
  if (agent.status === "active") return "active";
  const formatted = prettyMs(agent.age * 1000, { compact: true });
  return `idle ${formatted}`;
}

export function formatGitStatus(git: GitStatusResult): string {
  return git.status === "clean" ? "clean" : `${git.count} changed`;
}

export function isBusyStatus(status: PrStatus): boolean {
  return status === "loading" || status === "frozen" || status === "running" || status === "queued" || status === "waiting";
}

export function needsAttention(wt: WorktreeInfo): boolean {
  if (wt.paused || wt.blocked) return false;
  if (wt.git.status === "changed") return true;
  return wt.agent.status !== "active" && !isBusyStatus(wt.prStatus);
}

export function renderWorktreeTable(rows: DisplayRow[]): void {
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
    const nameLink = `[${wt.name}](${wt.cursorUrl})`;
    const agentDisplay = formatAgentStatus(wt.agent);
    const prLabel = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
    const prStatusDisplay = wt.prUrl ? `[${prLabel}](${wt.prUrl})` : prLabel;
    const qaDisplay = wt.qaStatus === "none" ? "-" : wt.qaStatus;
    console.log(`| ${attention} | ${nameLink} | ${agentDisplay} | ${formatGitStatus(wt.git)} | ${qaDisplay} | ${prStatusDisplay} |`);
  }
}
