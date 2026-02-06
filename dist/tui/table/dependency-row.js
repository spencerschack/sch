import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { getStatusColor, getDeployColor } from "./colors.js";
import { getDependencyStatusSummary } from "../../status/summary.js";
function getColorForSummary(depInfo, type) {
    if (!depInfo || type === "missing")
        return undefined;
    if (type === "deploy")
        return getDeployColor(depInfo.deployStatus);
    return getStatusColor(depInfo.prStatus);
}
export function DependencyRow({ name, depInfo }) {
    const gap = "  ";
    const { text: statusText, type } = getDependencyStatusSummary(depInfo);
    const statusColor = getColorForSummary(depInfo, type);
    return (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [" ", gap, "└─ ", name, " ("] }), _jsx(Text, { color: statusColor, dimColor: !statusColor, children: statusText }), _jsx(Text, { dimColor: true, children: ")" })] }));
}
