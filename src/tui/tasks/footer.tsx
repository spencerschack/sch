import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useTasks } from "./use-tasks.js";

export function TaskFooter() {
  const tasks = useTasks();

  if (tasks.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>Running tasks:</Text>
      {tasks.map((task, i) => (
        <Box key={i}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {task.status}</Text>
        </Box>
      ))}
    </Box>
  );
}
