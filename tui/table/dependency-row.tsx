import React from "react";
import { Box, Text } from "ink";
import type { ColumnWidths } from "./columns.js";

interface DependencyRowProps {
  name: string;
  widths: ColumnWidths;
}

export function DependencyRow({ name, widths }: DependencyRowProps) {
  const gap = "  ";
  const fullName = `└─ ${name}`;
  const namePad = fullName.padEnd(widths.name);
  const emptyAgent = "".padEnd(widths.agent);
  const emptyGit = "".padEnd(widths.git);
  const emptyQa = "".padEnd(widths.qa);
  const emptyPr = "".padEnd(widths.pr);

  return (
    <Box>
      <Text dimColor>
        {" "}{gap}{namePad}{gap}{emptyAgent}{gap}{emptyGit}{gap}{emptyQa}{gap}{emptyPr}
      </Text>
    </Box>
  );
}
