import prettyMs from "pretty-ms";
import type { AgentStatusResult, GitStatusResult, PrStatus, WorktreeInfo } from "./worktree-info.js";

export function formatAgentStatus(agent: AgentStatusResult): string {
  if (agent.status === "none") return "-";
  const formatted = prettyMs(agent.age * 1000, { compact: true });
  if (agent.status === "active") return `active ${formatted}`;
  return `idle ${formatted}`;
}

export function formatGitStatus(git: GitStatusResult): string {
  return git.status === "clean" ? "clean" : `${git.count} changed`;
}

export function isBusyStatus(status: PrStatus): boolean {
  return status === "frozen" || status === "running" || status === "queued" || status === "waiting";
}

export function renderWorktreeTable(worktrees: WorktreeInfo[]): void {
  console.log("| | Worktree | Agent | Git | QA | PR |");
  console.log("| --- | --- | --- | --- | --- | --- |");

  for (const wt of worktrees) {
    const needsAttention = wt.agent.status !== "active" && !isBusyStatus(wt.prStatus) && !wt.paused;
    const attention = wt.paused ? "P" : needsAttention ? "!" : "";
    const nameLink = `[${wt.name}](${wt.cursorUrl})`;
    const agentDisplay = formatAgentStatus(wt.agent);
    const prLabel = wt.prStatus === "none" ? "-" : wt.prStatus;
    const prStatusDisplay = wt.prUrl ? `[${prLabel}](${wt.prUrl})` : prLabel;
    const qaDisplay = wt.qaStatus === "none" ? "-" : wt.qaStatus;
    console.log(`| ${attention} | ${nameLink} | ${agentDisplay} | ${formatGitStatus(wt.git)} | ${qaDisplay} | ${prStatusDisplay} |`);
  }
}
