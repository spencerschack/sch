import React from "react";
import { Box, Text } from "ink";

interface FooterProps {
  message: string | null;
  focused: boolean;
  showAssign: boolean;
  showMerge: boolean;
}

export function Footer({ message, focused, showAssign, showMerge }: FooterProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>
        <Text color="cyan">↵</Text>{" Cursor   "}
        <Text color="cyan">⇥</Text>{" PR   "}
        <Text color="cyan">⌫</Text>{" Delete   "}
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
      ) : !focused ? (
        <Text color="yellow">Paused (unfocused)</Text>
      ) : null}
    </Box>
  );
}
