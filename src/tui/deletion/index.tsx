import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { DeleteConfirmResult } from "./use-deletion.js";

export { useDeleteConfirm, type DeleteConfirmResult, type DeleteState } from "./use-deletion.js";

interface DeletionFlowProps {
  deletion: DeleteConfirmResult;
}

export function DeletionFlow({ deletion }: DeletionFlowProps) {
  if (!deletion.active || !deletion.worktree) {
    return null;
  }

  if (deletion.state === "deleting") {
    return (
      <Box>
        <Text color="cyan"><Spinner type="dots" /></Text>
        <Text> Removing {deletion.worktree.name}...</Text>
      </Box>
    );
  }

  if (deletion.state === "confirming") {
    return (
      <Box>
        <Text>
          Delete <Text color="yellow">{deletion.worktree.name}</Text> without merged PR? (
          <Text color="cyan">y</Text>/<Text color="cyan">n</Text>)
        </Text>
      </Box>
    );
  }

  return null;
}
