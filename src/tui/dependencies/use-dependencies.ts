import { useState, useCallback, useMemo } from "react";
import type { WorktreeInfo, DisplayRow } from "../../worktree/types.js";
import { isDependencyRef } from "../../worktree/types.js";
import { readWorktreeConfig, writeWorktreeConfig } from "../../worktree/config.js";

export interface DependencyOption {
  label: string;
  value: string;
}

export interface DependenciesResult {
  active: boolean;
  options: DependencyOption[];
  start: () => void;
  cancel: () => void;
  toggle: (depName: string) => Promise<string>;
  handleInput: (input: string, key: { escape?: boolean }) => boolean;
}

export interface UseDependenciesOptions {
  selectedWorktree: WorktreeInfo | null;
  allData: DisplayRow[];
  onMessage?: (message: string) => void;
  onComplete?: () => Promise<unknown>;
}

export function useDependencies(options: UseDependenciesOptions): DependenciesResult {
  const [active, setActive] = useState(false);
  const { selectedWorktree, allData, onMessage, onComplete } = options;

  const start = useCallback(() => {
    if (!selectedWorktree) return;
    setActive(true);
  }, [selectedWorktree]);

  const cancel = useCallback(() => {
    setActive(false);
  }, []);

  const toggle = useCallback(async (depName: string): Promise<string> => {
    if (!selectedWorktree) return "";

    const config = await readWorktreeConfig(selectedWorktree.name);
    const deps = config.dependsOn ?? [];
    let message: string;

    if (deps.includes(depName)) {
      // Remove if already present
      config.dependsOn = deps.filter((d) => d !== depName);
      if (config.dependsOn.length === 0) {
        delete config.dependsOn;
      }
      message = `${selectedWorktree.name}: removed dep ${depName}`;
    } else {
      // Add if not present
      config.dependsOn = [...deps, depName];
      message = `${selectedWorktree.name}: added dep ${depName}`;
    }

    await writeWorktreeConfig(selectedWorktree.name, config);
    onMessage?.(message);
    setActive(false);
    await onComplete?.();
    return message;
  }, [selectedWorktree, onMessage, onComplete]);

  // Build options list (all worktrees except current, with checkmarks)
  const currentDeps = selectedWorktree?.dependsOn ?? [];
  const options_list: DependencyOption[] = useMemo(() => {
    const existingWorktrees = allData
      .filter((row): row is WorktreeInfo => !isDependencyRef(row) && row.name !== selectedWorktree?.name);
    
    const existingNames = new Set(existingWorktrees.map((wt) => wt.name));
    
    // Options for existing worktrees
    const existingOptions = existingWorktrees.map((wt) => {
      const isSelected = currentDeps.includes(wt.name);
      return { label: `${isSelected ? "✓ " : "  "}${wt.name}`, value: wt.name };
    });
    
    // Options for stale dependencies (referenced but no longer exist)
    const staleOptions = currentDeps
      .filter((dep) => !existingNames.has(dep))
      .map((dep) => ({ label: `✓ ${dep} (missing)`, value: dep }));
    
    return [...staleOptions, ...existingOptions];
  }, [allData, selectedWorktree?.name, currentDeps]);

  // Handle input - returns true if handled (consumes all input when active)
  const handleInput = useCallback((input: string, key: { escape?: boolean }): boolean => {
    if (!active) return false;

    if (key.escape) {
      cancel();
    }

    // Always consume input when modal is active to prevent leaking to main handler
    return true;
  }, [active, cancel]);

  return {
    active,
    options: options_list,
    start,
    cancel,
    toggle,
    handleInput,
  };
}
