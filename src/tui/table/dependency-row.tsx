import React from "react";
import { Box, Text } from "ink";
import type { WorktreeInfo } from "../../worktree/types.js";
import { getStatusColor, getDeployColor } from "./colors.js";
import { getDependencyStatusSummary } from "../../status/summary.js";

interface DependencyRowProps {
  name: string;
  depInfo?: WorktreeInfo;
}

function getColorForSummary(depInfo: WorktreeInfo | undefined, type: "pr" | "deploy" | "missing"): string | undefined {
  if (!depInfo || type === "missing") return undefined;
  if (type === "deploy") return getDeployColor(depInfo.deployStatus);
  return getStatusColor(depInfo.prStatus);
}

export function DependencyRow({ name, depInfo }: DependencyRowProps) {
  const gap = "  ";
  const { text: statusText, type } = getDependencyStatusSummary(depInfo);
  const statusColor = getColorForSummary(depInfo, type);

  return (
    <Box>
      <Text dimColor>
        {" "}{gap}{"└─ "}{name}{" ("}
      </Text>
      <Text color={statusColor} dimColor={!statusColor}>
        {statusText}
      </Text>
      <Text dimColor>{")"}</Text>
    </Box>
  );
}
