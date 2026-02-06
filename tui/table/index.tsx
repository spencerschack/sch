import React, { useMemo } from "react";
import { Box } from "ink";
import type { DisplayRow } from "../../worktree-info.js";
import { isDependencyRef } from "../../worktree-info.js";
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

  return (
    <Box flexDirection="column">
      <TableHeader widths={widths} lastRemoteRefresh={lastRemoteRefresh} />
      {data.map((row, i) => {
        if (isDependencyRef(row)) {
          return <DependencyRow key={`dep-${row.dependentName}-${row.name}`} name={row.name} widths={widths} />;
        }
        return <WorktreeRow key={`${row.name}-${i}`} wt={row} selected={i === selected} widths={widths} />;
      })}
    </Box>
  );
}
