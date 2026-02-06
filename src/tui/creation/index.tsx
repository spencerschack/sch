import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import type { CreationResult } from "./use-creation.js";
import { baseOptions, providerOptions } from "./use-creation.js";
import type { AgentProvider } from "../../worktree/config.js";

export { useCreation, type CreationResult } from "./use-creation.js";

interface CreationFlowProps {
  creation: CreationResult;
}

export function CreationFlow({ creation }: CreationFlowProps) {
  if (!creation.active) {
    return null;
  }

  if (creation.state === "creating") {
    return (
      <Box>
        <Text color="cyan"><Spinner type="dots" /></Text>
        <Text> Creating worktree...</Text>
      </Box>
    );
  }

  if (creation.state === "selectingBase") {
    return (
      <Box>
        <Text>Base: </Text>
        <SelectInput
          items={baseOptions}
          onSelect={(item) => creation.selectBase(item.value)}
        />
      </Box>
    );
  }

  if (creation.state === "enteringDescription") {
    return (
      <Box>
        <Text>Description for {creation.base}: </Text>
        <TextInput
          value={creation.description}
          onChange={creation.setDescription}
          onSubmit={creation.submitDescription}
        />
      </Box>
    );
  }

  if (creation.state === "selectingProvider") {
    const desc = creation.description.trim().replace(/\s+/g, "-").toLowerCase();
    return (
      <Box>
        <Text>Provider for {creation.base}-{desc}: </Text>
        <SelectInput
          items={providerOptions}
          onSelect={(item) => creation.selectProvider(item.value as AgentProvider)}
        />
      </Box>
    );
  }

  return null;
}
