import { isDependencyRef } from "../../worktree/types.js";
import { formatAgentStatus, formatGitStatus } from "../../cli/render-table.js";
import { needsAttention } from "../../status/attention.js";
export function getRowData(wt) {
    const wtNeedsAttention = needsAttention(wt);
    const attention = wtNeedsAttention ? "!" : " ";
    const agent = formatAgentStatus(wt.agent);
    const git = formatGitStatus(wt.git);
    const pr = wt.prStatus === "none" ? "-" : wt.prStatus === "loading" ? "..." : wt.prStatus;
    const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
    return { attention, name: wt.name, agent, git, qa, pr, needsAttention: wtNeedsAttention };
}
export function computeColumnWidths(data) {
    const widths = {
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
