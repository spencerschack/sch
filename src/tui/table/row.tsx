import React from "react";
import { Box, Text } from "ink";
import type { WorktreeInfo } from "../../worktree/types.js";
import type { ColumnWidths } from "./columns.js";
import { getRowData } from "./columns.js";
import { getHighlightColumn } from "./highlight.js";
import { getStatusColor, getAgentColor, getQaColor } from "./colors.js";

interface WorktreeRowProps {
  wt: WorktreeInfo;
  selected: boolean;
  widths: ColumnWidths;
}

export function WorktreeRow({ wt, selected, widths }: WorktreeRowProps) {
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

  return (
    <Box>
      <Text backgroundColor={bgColor} dimColor={dimmed}>
        <Text color={row.needsAttention ? "red" : undefined}>
          {attentionPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : "blue"} bold={selected}>
          {namePad}
        </Text>
        {gap}
        <Text color={highlight === "agent" ? getAgentColor(wt.agent.status) : undefined}>
          {agentPad}
        </Text>
        {gap}
        <Text color={highlight === "git" ? "yellow" : undefined}>
          {gitPad}
        </Text>
        {gap}
        <Text color={highlight === "qa" ? getQaColor(wt.qaStatus) : undefined}>
          {qaPad}
        </Text>
        {gap}
        <Text color={highlight === "pr" ? getStatusColor(wt.prStatus) : undefined}>
          {prPad}
        </Text>
      </Text>
    </Box>
  );
}
