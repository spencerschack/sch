import React from "react";
import { Box, Text } from "ink";
import type { WorktreeInfo } from "../../worktree/types.js";
import type { ColumnWidths } from "./columns.js";
import { getRowData } from "./columns.js";
import { getHighlightColumn } from "./highlight.js";
import { getStatusColor, getAgentColor, getQaColor, getDeployColor } from "./colors.js";
import { getDependencyStatusSummary } from "../../status/summary.js";

interface WorktreeRowProps {
  wt: WorktreeInfo;
  selected: boolean;
  widths: ColumnWidths;
  worktreeMap: Map<string, WorktreeInfo>;
}

function getColorForDependency(depInfo: WorktreeInfo | undefined, type: "pr" | "deploy" | "missing"): string | undefined {
  if (!depInfo || type === "missing") return undefined;
  if (type === "deploy") return getDeployColor(depInfo.deployStatus);
  return getStatusColor(depInfo.prStatus);
}

export function WorktreeRow({ wt, selected, widths, worktreeMap }: WorktreeRowProps) {
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
  const deployPad = row.deploy.padEnd(widths.deploy);

  return (
    <Box flexDirection="column">
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
          {gap}
          <Text color={highlight === "deploy" ? getDeployColor(wt.deployStatus) : undefined}>
            {deployPad}
          </Text>
        </Text>
      </Box>
      {wt.dependsOn.map((dep) => {
        const depInfo = worktreeMap.get(dep);
        const { text: statusText, type } = getDependencyStatusSummary(depInfo);
        const statusColor = getColorForDependency(depInfo, type);
        return (
          <Box key={dep}>
            <Text dimColor>
              {" "}{gap}{"└─ "}{dep}{" ("}
            </Text>
            <Text color={statusColor} dimColor={!statusColor}>
              {statusText}
            </Text>
            <Text dimColor>{")"}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
