import prettyMs from "pretty-ms";
import { needsAttention, getDependencyStatusSummary } from "../status/index.js";
import { getWorktreeWorkingDir } from "../agent/provider.js";
export function formatAgentStatus(agent) {
    if (agent.status === "none")
        return "-";
    if (agent.status === "active")
        return "active";
    const formatted = prettyMs(agent.age * 1000, { compact: true });
    return `idle ${formatted}`;
}
export function formatGitStatus(git) {
    return git.status === "clean" ? "clean" : `${git.count} changed`;
}
async function getWorktreeUrl(wt) {
    // For cursor provider, use cursor:// URL scheme
    // For TMUX-based providers, just use the working directory path
    const workingDir = await getWorktreeWorkingDir(wt.name);
    if (wt.agentProvider === "cursor") {
        return `cursor://file/${workingDir}`;
    }
    // For CLI providers, link to the working directory
    return workingDir;
}
function formatDeployStatus(status) {
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
export async function renderWorktreeTable(worktrees) {
    // Build a map for dependency lookups
    const worktreeMap = new Map();
    for (const wt of worktrees) {
        worktreeMap.set(wt.name, wt);
    }
    console.log("| | Worktree | Agent | Git | QA | PR | Deploy |");
    console.log("| --- | --- | --- | --- | --- | --- | --- |");
    for (const wt of worktrees) {
        const attention = needsAttention(wt) ? "!" : "-";
        const url = await getWorktreeUrl(wt);
        const nameLink = `[${wt.name}](${url})`;
        const agentDisplay = formatAgentStatus(wt.agent);
        const prLabel = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
        const prStatusDisplay = wt.prUrl ? `[${prLabel}](${wt.prUrl})` : prLabel;
        const qaDisplay = wt.qaStatus === "none" ? "-" : wt.qaStatus;
        const deployDisplay = formatDeployStatus(wt.deployStatus);
        console.log(`| ${attention} | ${nameLink} | ${agentDisplay} | ${formatGitStatus(wt.git)} | ${qaDisplay} | ${prStatusDisplay} | ${deployDisplay} |`);
        // Render dependency refs after each worktree
        for (const dep of wt.dependsOn) {
            const depInfo = worktreeMap.get(dep);
            const { text: statusSummary } = getDependencyStatusSummary(depInfo);
            console.log(`|  | └─ ${dep} (${statusSummary}) |  |  |  |  |  |`);
        }
    }
}
