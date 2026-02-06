import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { ColumnWidths } from "./columns.js";

interface TableHeaderProps {
  widths: ColumnWidths;
  lastRemoteRefresh: Date | null;
}

export function TableHeader({ widths, lastRemoteRefresh }: TableHeaderProps) {
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
  return (
    <Box>
      <Text dimColor>
        {" "}
        {gap}
        {"Worktree".padEnd(widths.name)}
        {gap}
        {"Agent".padEnd(widths.agent)}
        {gap}
        {"Git".padEnd(widths.git)}
        {gap}
        {"QA".padEnd(widths.qa)}
        {gap}
        {prHeader.padEnd(widths.pr)}
        {gap}
        {"Deploy".padEnd(widths.deploy)}
      </Text>
    </Box>
  );
}
