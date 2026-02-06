import { formatAgentStatus, formatGitStatus } from "../../cli/render-table.js";
import { needsAttention } from "../../status/attention.js";
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
export function getRowData(wt) {
    const wtNeedsAttention = needsAttention(wt);
    const attention = wtNeedsAttention ? "!" : " ";
    const agent = formatAgentStatus(wt.agent);
    const git = formatGitStatus(wt.git);
    const pr = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
    const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
    const deploy = formatDeployStatus(wt.deployStatus);
    return { attention, name: wt.name, agent, git, qa, pr, deploy, needsAttention: wtNeedsAttention };
}
export function computeColumnWidths(worktrees) {
    const widths = {
        name: "Worktree".length,
        agent: "Agent".length,
        git: "Git".length,
        qa: "QA".length,
        pr: "PR".length,
        deploy: "Deploy".length,
    };
    for (const wt of worktrees) {
        const row = getRowData(wt);
        widths.name = Math.max(widths.name, row.name.length);
        widths.agent = Math.max(widths.agent, row.agent.length);
        widths.git = Math.max(widths.git, row.git.length);
        widths.qa = Math.max(widths.qa, row.qa.length);
        widths.pr = Math.max(widths.pr, row.pr.length);
        widths.deploy = Math.max(widths.deploy, row.deploy.length);
    }
    return widths;
}
