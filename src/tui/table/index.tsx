import React, { useMemo } from "react";
import { Box } from "ink";
import type { DisplayRow, WorktreeInfo } from "../../worktree/types.js";
import { isDependencyRef } from "../../worktree/types.js";
import { computeColumnWidths } from "./columns.js";
import { TableHeader } from "./header.js";
import { WorktreeRow } from "./row.js";
import { DependencyRow } from "./dependency-row.js";

export { type ColumnWidths } from "./columns.js";

interface WorktreeTableProps {
  data: DisplayRow[];
  selected: number;
  lastRemoteRefresh: Date | null;
}

export function WorktreeTable({ data, selected, lastRemoteRefresh }: WorktreeTableProps) {
  const widths = useMemo(() => computeColumnWidths(data), [data]);
  
  // Build a map of worktree name -> info for dependency lookups
  const worktreeMap = useMemo(() => {
    const map = new Map<string, WorktreeInfo>();
    for (const row of data) {
      if (!isDependencyRef(row)) {
        map.set(row.name, row);
      }
    }
    return map;
  }, [data]);

  return (
    <Box flexDirection="column">
      <TableHeader widths={widths} lastRemoteRefresh={lastRemoteRefresh} />
      {data.map((row, i) => {
        if (isDependencyRef(row)) {
          const depInfo = worktreeMap.get(row.name);
          return <DependencyRow key={`dep-${row.dependentName}-${row.name}`} name={row.name} depInfo={depInfo} />;
        }
        return <WorktreeRow key={`${row.name}-${i}`} wt={row} selected={i === selected} widths={widths} />;
      })}
    </Box>
  );
}
