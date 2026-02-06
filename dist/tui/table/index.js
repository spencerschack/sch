import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Box } from "ink";
import { isDependencyRef } from "../../worktree/types.js";
import { computeColumnWidths } from "./columns.js";
import { TableHeader } from "./header.js";
import { WorktreeRow } from "./row.js";
import { DependencyRow } from "./dependency-row.js";
export function WorktreeTable({ data, selected, lastRemoteRefresh }) {
    const widths = useMemo(() => computeColumnWidths(data), [data]);
    // Build a map of worktree name -> info for dependency lookups
    const worktreeMap = useMemo(() => {
        const map = new Map();
        for (const row of data) {
            if (!isDependencyRef(row)) {
                map.set(row.name, row);
            }
        }
        return map;
    }, [data]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TableHeader, { widths: widths, lastRemoteRefresh: lastRemoteRefresh }), data.map((row, i) => {
                if (isDependencyRef(row)) {
                    const depInfo = worktreeMap.get(row.name);
                    return _jsx(DependencyRow, { name: row.name, depInfo: depInfo }, `dep-${row.dependentName}-${row.name}`);
                }
                return _jsx(WorktreeRow, { wt: row, selected: i === selected, widths: widths }, `${row.name}-${i}`);
            })] }));
}
