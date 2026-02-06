import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { DependenciesResult } from "./use-dependencies.js";

export { useDependencies, type DependenciesResult } from "./use-dependencies.js";

interface DependencyFlowProps {
  dependencies: DependenciesResult;
}

export function DependencyFlow({ dependencies }: DependencyFlowProps) {
  if (!dependencies.active) {
    return null;
  }

  return (
    <Box>
      <Text>Depends on: </Text>
      <SelectInput
        items={dependencies.options}
        onSelect={(item) => dependencies.toggle(item.value)}
      />
    </Box>
  );
}
