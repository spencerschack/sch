import React from "react";
import { Box, Text } from "ink";

interface FooterProps {
  refreshing: boolean;
  message: string | null;
  focused: boolean;
  showDelete: boolean;
  showAssign: boolean;
  showMerge: boolean;
}

export function Footer({ refreshing, message, focused, showDelete, showAssign, showMerge }: FooterProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>
        <Text color="cyan">↵</Text>{" Cursor   "}
        <Text color="cyan">⇥</Text>{" PR   "}
        {showDelete && <><Text color="cyan">⌫</Text>{" Delete   "}</>}
        {showAssign && <><Text color="cyan">A</Text>{"ssign   "}</>}
        {showMerge && <><Text color="cyan">M</Text>{"erge   "}</>}
        <Text color="cyan">P</Text>{"ause   "}
        <Text color="cyan">D</Text>{"ep   "}
        <Text color="cyan">Q</Text>{"A   "}
        <Text color="cyan">R</Text>{"efresh   "}
        <Text color="cyan">N</Text>{"ew"}
      </Text>
      {message ? (
        <Text color="green">{message}</Text>
      ) : refreshing ? (
        <Text color="cyan">Refreshing...</Text>
      ) : !focused ? (
        <Text color="yellow">Paused (unfocused)</Text>
      ) : null}
    </Box>
  );
}
