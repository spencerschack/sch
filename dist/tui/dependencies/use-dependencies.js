import { useState, useCallback, useMemo } from "react";
import { isDependencyRef } from "../../worktree/types.js";
import { readWorktreeConfig, writeWorktreeConfig } from "../../worktree/config.js";
export function useDependencies(options) {
    const [active, setActive] = useState(false);
    const { selectedWorktree, allData, onMessage, onComplete } = options;
    const start = useCallback(() => {
        if (!selectedWorktree)
            return;
        setActive(true);
    }, [selectedWorktree]);
    const cancel = useCallback(() => {
        setActive(false);
    }, []);
    const toggle = useCallback(async (depName) => {
        if (!selectedWorktree)
            return "";
        const config = await readWorktreeConfig(selectedWorktree.name);
        const deps = config.dependsOn ?? [];
        let message;
        if (deps.includes(depName)) {
            // Remove if already present
            config.dependsOn = deps.filter((d) => d !== depName);
            if (config.dependsOn.length === 0) {
                delete config.dependsOn;
            }
            message = `${selectedWorktree.name}: removed dep ${depName}`;
        }
        else {
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
    const options_list = useMemo(() => {
        const existingWorktrees = allData
            .filter((row) => !isDependencyRef(row) && row.name !== selectedWorktree?.name);
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
    const handleInput = useCallback((input, key) => {
        if (!active)
            return false;
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
