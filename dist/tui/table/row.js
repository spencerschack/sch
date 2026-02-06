import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { getRowData } from "./columns.js";
import { getHighlightColumn } from "./highlight.js";
import { getStatusColor, getAgentColor, getQaColor, getDeployColor } from "./colors.js";
import { getDependencyStatusSummary } from "../../status/summary.js";
function getColorForDependency(depInfo, type) {
    if (!depInfo || type === "missing")
        return undefined;
    if (type === "deploy")
        return getDeployColor(depInfo.deployStatus);
    return getStatusColor(depInfo.prStatus);
}
export function WorktreeRow({ wt, selected, widths, worktreeMap }) {
    const row = getRowData(wt);
    const bgColor = selected ? "whiteBright" : undefined;
    const dimmed = wt.paused || wt.blocked;
    const highlight = dimmed ? null : getHighlightColumn(wt);
    // Pad each cell to fill its column width, plus 2 for gap
    const gap = "  ";
    const attentionPad = row.attention;
    const namePad = row.name.padEnd(widths.name);
    const agentPad = row.agent.padEnd(widths.agent);
    const gitPad = row.git.padEnd(widths.git);
    const qaPad = row.qa.padEnd(widths.qa);
    const prPad = row.pr.padEnd(widths.pr);
    const deployPad = row.deploy.padEnd(widths.deploy);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { backgroundColor: bgColor, dimColor: dimmed, children: [_jsx(Text, { color: row.needsAttention ? "red" : undefined, children: attentionPad }), gap, _jsx(Text, { color: dimmed ? undefined : "blue", bold: selected, children: namePad }), gap, _jsx(Text, { color: highlight === "agent" ? getAgentColor(wt.agent.status) : undefined, children: agentPad }), gap, _jsx(Text, { color: highlight === "git" ? "yellow" : undefined, children: gitPad }), gap, _jsx(Text, { color: highlight === "qa" ? getQaColor(wt.qaStatus) : undefined, children: qaPad }), gap, _jsx(Text, { color: highlight === "pr" ? getStatusColor(wt.prStatus) : undefined, children: prPad }), gap, _jsx(Text, { color: highlight === "deploy" ? getDeployColor(wt.deployStatus) : undefined, children: deployPad })] }) }), wt.dependsOn.map((dep) => {
                const depInfo = worktreeMap.get(dep);
                const { text: statusText, type } = getDependencyStatusSummary(depInfo);
                const statusColor = getColorForDependency(depInfo, type);
                return (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [" ", gap, "└─ ", dep, " ("] }), _jsx(Text, { color: statusColor, dimColor: !statusColor, children: statusText }), _jsx(Text, { dimColor: true, children: ")" })] }, dep));
            })] }));
}
