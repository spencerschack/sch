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
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TableHeader, { widths: widths, lastRemoteRefresh: lastRemoteRefresh }), data.map((row, i) => {
                if (isDependencyRef(row)) {
                    return _jsx(DependencyRow, { name: row.name, widths: widths }, `dep-${row.dependentName}-${row.name}`);
                }
                return _jsx(WorktreeRow, { wt: row, selected: i === selected, widths: widths }, `${row.name}-${i}`);
            })] }));
}
