import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import { isDependencyRef } from "../worktree/types.js";
import type { WorktreeInfo } from "../worktree/types.js";

// Data
import { useFocused, useWorktreeData } from "./data/index.js";

// Table
import { WorktreeTable } from "./table/index.js";

// Actions
import { handleOpen, handleDelete, handlePause, handleQa } from "./actions/index.js";

// PR
import { handleOpenPr, handleAssign, handleMerge } from "./pr/index.js";

// Creation
import { useCreation, CreationFlow } from "./creation/index.js";

// Dependencies
import { useDependencies, DependencyFlow } from "./dependencies/index.js";

// Footer
import { Footer } from "./footer.js";

export function WorktreeApp() {
  const { exit } = useApp();
  const focused = useFocused();
  const { data, loading, lastRemoteRefresh, refresh, refreshLocal } = useWorktreeData(!focused);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Clear message after 2 seconds
  useEffect(() => {
    if (message) {
      const id = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [message]);

  // Helper to find next selectable index (skipping dependency refs)
  const findNextSelectable = useCallback((from: number, direction: 1 | -1): number => {
    let next = from + direction;
    while (next >= 0 && next < data.length) {
      if (!isDependencyRef(data[next])) {
        return next;
      }
      next += direction;
    }
    return from; // Stay at current if no selectable found
  }, [data]);

  // Get all selectable indices
  const selectableIndices = useMemo(() => 
    data.map((row, i) => isDependencyRef(row) ? -1 : i).filter(i => i >= 0),
    [data]
  );

  // Keep selection in bounds and on a selectable row
  useEffect(() => {
    if (selectableIndices.length === 0) return;
    if (!selectableIndices.includes(selected)) {
      const firstSelectable = selectableIndices[0];
      setSelected(firstSelectable);
    } else if (selected >= data.length) {
      setSelected(selectableIndices[selectableIndices.length - 1]);
    }
  }, [data.length, selected, selectableIndices]);

  const selectedRow = data[selected];
  const selectedWorktree = selectedRow && !isDependencyRef(selectedRow) ? selectedRow : null;

  const showDelete = selectedWorktree?.prStatus === "merged";
  const showAssign = selectedWorktree?.prStatus === "assign";
  const showMerge = selectedWorktree?.prStatus === "approved";

  // Creation flow
  const creation = useCreation({
    onCreated: refreshLocal,
    onMessage: setMessage,
  });

  // Dependencies flow
  const dependencies = useDependencies({
    selectedWorktree,
    allData: data,
    onMessage: setMessage,
    onComplete: refreshLocal,
  });

  // Main input handling - delegates to active modal first
  useInput((input, key) => {
    // Delegate to creation flow if active
    if (creation.handleInput(input, key)) return;

    // Delegate to dependencies flow if active
    if (dependencies.handleInput(input, key)) return;

    // Handle escape for exiting (only when no modal is active)
    if (key.escape) {
      exit();
      return;
    }

    // Navigation
    if (key.upArrow || input === "k") {
      setSelected((i) => findNextSelectable(i, -1));
    }
    if (key.downArrow || input === "j") {
      setSelected((i) => findNextSelectable(i, 1));
    }

    // Actions
    if (key.return && selectedWorktree) {
      handleOpen(selectedWorktree).then((result) => setMessage(result.message));
    }
    if (key.tab && selectedWorktree) {
      handleOpenPr(selectedWorktree).then((result) => setMessage(result.message));
    }
    if (key.delete && selectedWorktree) {
      setMessage(`Removing ${selectedWorktree.name}...`);
      handleDelete(selectedWorktree).then((result) => {
        setMessage(result.message);
        if (result.success) refreshLocal();
      });
    }
    if (input === "a" && selectedWorktree) {
      handleAssign(selectedWorktree).then((result) => setMessage(result.message));
    }
    if (input === "m" && selectedWorktree) {
      setMessage(`Merging ${selectedWorktree.name}...`);
      handleMerge(selectedWorktree).then((result) => {
        setMessage(result.message);
        if (result.success) refresh();
      });
    }
    if (input === "p" && selectedWorktree) {
      handlePause(selectedWorktree).then((result) => {
        setMessage(result.message);
        refreshLocal();
      });
    }
    if (input === "q" && selectedWorktree) {
      handleQa(selectedWorktree).then((result) => {
        setMessage(result.message);
        refreshLocal();
      });
    }
    if (input === "r") {
      refresh();
    }
    if (input === "n") {
      creation.start();
    }
    if (input === "d" && selectedWorktree) {
      dependencies.start();
    }
  });

  // Initial loading state
  if (data.length === 0 && loading) {
    return (
      <Box>
        <Text color="cyan"><Spinner type="dots" /></Text>
        <Text> Loading worktrees...</Text>
      </Box>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <Box flexDirection="column">
        <Text>No worktrees found</Text>
      </Box>
    );
  }

  // Render footer or modal input
  const renderFooterOrInput = () => {
    if (creation.active) {
      return <CreationFlow creation={creation} />;
    }

    if (dependencies.active) {
      return <DependencyFlow dependencies={dependencies} />;
    }

    return (
      <Footer
        refreshing={loading}
        message={message}
        focused={focused}
        showDelete={showDelete}
        showAssign={showAssign}
        showMerge={showMerge}
      />
    );
  };

  return (
    <Box flexDirection="column">
      <WorktreeTable data={data} selected={selected} lastRemoteRefresh={lastRemoteRefresh} />
      {renderFooterOrInput()}
    </Box>
  );
}
