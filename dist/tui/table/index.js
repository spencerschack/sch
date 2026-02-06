import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Box } from "ink";
import { computeColumnWidths } from "./columns.js";
import { TableHeader } from "./header.js";
import { WorktreeRow } from "./row.js";
export function WorktreeTable({ worktrees, selected, lastRemoteRefresh }) {
    // Build a map of worktree name -> info for dependency lookups
    const worktreeMap = useMemo(() => {
        const map = new Map();
        for (const wt of worktrees) {
            map.set(wt.name, wt);
        }
        return map;
    }, [worktrees]);
    const widths = useMemo(() => computeColumnWidths(worktrees), [worktrees]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TableHeader, { widths: widths, lastRemoteRefresh: lastRemoteRefresh }), worktrees.map((wt, i) => (_jsx(WorktreeRow, { wt: wt, selected: i === selected, widths: widths, worktreeMap: worktreeMap }, wt.name)))] }));
}
