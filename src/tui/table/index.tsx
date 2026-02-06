import React, { useMemo } from "react";
import { Box } from "ink";
import type { WorktreeInfo } from "../../worktree/types.js";
import { computeColumnWidths } from "./columns.js";
import { TableHeader } from "./header.js";
import { WorktreeRow } from "./row.js";

export { type ColumnWidths } from "./columns.js";

interface WorktreeTableProps {
  worktrees: WorktreeInfo[];
  selected: number;
  lastRemoteRefresh: Date | null;
}

export function WorktreeTable({ worktrees, selected, lastRemoteRefresh }: WorktreeTableProps) {
  // Build a map of worktree name -> info for dependency lookups
  const worktreeMap = useMemo(() => {
    const map = new Map<string, WorktreeInfo>();
    for (const wt of worktrees) {
      map.set(wt.name, wt);
    }
    return map;
  }, [worktrees]);

  const widths = useMemo(() => computeColumnWidths(worktrees), [worktrees]);

  return (
    <Box flexDirection="column">
      <TableHeader widths={widths} lastRemoteRefresh={lastRemoteRefresh} />
      {worktrees.map((wt, i) => (
        <WorktreeRow
          key={wt.name}
          wt={wt}
          selected={i === selected}
          widths={widths}
          worktreeMap={worktreeMap}
        />
      ))}
    </Box>
  );
}
