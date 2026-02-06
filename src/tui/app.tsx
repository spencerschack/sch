import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";

// Data
import { useFocused, useWorktreeData } from "./data/index.js";

// Table
import { WorktreeTable } from "./table/index.js";

// Actions
import { handleOpen, handlePause, handleQa } from "./actions/index.js";

// Deletion
import { useDeleteConfirm, DeletionFlow } from "./deletion/index.js";

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
  const { worktrees, loading, lastRemoteRefresh, refresh, refreshLocal } = useWorktreeData(!focused);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Clear message after 2 seconds
  useEffect(() => {
    if (message) {
      const id = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [message]);

  // Keep selection in bounds
  useEffect(() => {
    if (worktrees.length === 0) return;
    if (selected >= worktrees.length) {
      setSelected(worktrees.length - 1);
    }
  }, [worktrees.length, selected]);

  const selectedWorktree = worktrees[selected] ?? null;

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
    worktrees,
    onMessage: setMessage,
    onComplete: refreshLocal,
  });

  // Delete confirmation flow
  const deleteConfirm = useDeleteConfirm({
    onComplete: (result) => setMessage(result.message),
    onRefresh: refreshLocal,
  });

  // Main input handling - delegates to active modal first
  useInput((input, key) => {
    // Delegate to creation flow if active
    if (creation.handleInput(input, key)) return;

    // Delegate to dependencies flow if active
    if (dependencies.handleInput(input, key)) return;

    // Delegate to delete confirmation if active
    if (deleteConfirm.handleInput(input, key)) return;

    // Handle escape for exiting (only when no modal is active)
    if (key.escape) {
      exit();
      return;
    }

    // Navigation
    if (key.upArrow || input === "k") {
      setSelected((i) => Math.max(0, i - 1));
    }
    if (key.downArrow || input === "j") {
      setSelected((i) => Math.min(worktrees.length - 1, i + 1));
    }

    // Actions
    if (key.return && selectedWorktree) {
      handleOpen(selectedWorktree)
        .then((result) => setMessage(result.message))
        .catch((err) => setMessage(`Error: ${err.message}`));
    }
    if (key.tab && selectedWorktree) {
      handleOpenPr(selectedWorktree).then((result) => setMessage(result.message));
    }
    if (key.delete && selectedWorktree) {
      deleteConfirm.start(selectedWorktree);
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
      const action = selectedWorktree.qaStatus === "done" ? "Clearing" : "Processing";
      setMessage(`${action} QA for ${selectedWorktree.name}...`);
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
  if (worktrees.length === 0 && loading) {
    return (
      <Box>
        <Text color="cyan"><Spinner type="dots" /></Text>
        <Text> Loading worktrees...</Text>
      </Box>
    );
  }

  if (worktrees.length === 0 && !loading) {
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

    if (deleteConfirm.active) {
      return <DeletionFlow deletion={deleteConfirm} />;
    }

    return (
      <Footer
        refreshing={loading}
        message={message}
        focused={focused}
        showAssign={showAssign}
        showMerge={showMerge}
      />
    );
  };

  return (
    <Box flexDirection="column">
      <WorktreeTable worktrees={worktrees} selected={selected} lastRemoteRefresh={lastRemoteRefresh} />
      {renderFooterOrInput()}
    </Box>
  );
}
