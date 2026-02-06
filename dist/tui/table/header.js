import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
export function TableHeader({ widths, lastRemoteRefresh }) {
    // Tick every second to update the time ago display
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);
    const gap = "  ";
    const prHeader = lastRemoteRefresh
        ? `PR (${Math.floor((Date.now() - lastRemoteRefresh.getTime()) / 60000)}m)`
        : "PR";
    return (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [" ", gap, "Worktree".padEnd(widths.name), gap, "Agent".padEnd(widths.agent), gap, "Git".padEnd(widths.git), gap, "QA".padEnd(widths.qa), gap, prHeader.padEnd(widths.pr), gap, "Deploy".padEnd(widths.deploy)] }) }));
}
