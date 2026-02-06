import { useState, useCallback } from "react";
import { createWorktree, WORKTREE_CONFIGS } from "../../lifecycle/create.js";
import { runTask } from "../tasks/runner.js";
/**
 * Normalize description: lowercase, replace spaces with dashes, remove punctuation
 */
function normalizeDescription(input) {
    return input
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}
export function useCreation(options = {}) {
    const [state, setState] = useState("idle");
    const [base, setBase] = useState("");
    const [description, setDescription] = useState("");
    const [provider, setProvider] = useState("cursor");
    const [message, setMessage] = useState(null);
    const active = state !== "idle";
    const start = useCallback(() => {
        setState("selectingBase");
        setBase("");
        setDescription("");
        setProvider("cursor");
        setMessage(null);
    }, []);
    const selectBase = useCallback((selectedBase) => {
        setBase(selectedBase);
        setDescription("");
        setState("enteringDescription");
    }, []);
    const submitDescription = useCallback(() => {
        if (!description) {
            const msg = "Description cannot be empty";
            setMessage(msg);
            options.onMessage?.(msg);
            setState("idle");
            return;
        }
        // Move to provider selection
        setState("selectingProvider");
    }, [description, options]);
    const selectProvider = useCallback(async (selectedProvider) => {
        setProvider(selectedProvider);
        const worktreeName = description;
        // Run task (fire-and-forget)
        runTask(async (setStatus) => {
            setStatus(`Creating ${worktreeName}...`);
            return await createWorktree(base, description, {
                provider: selectedProvider,
                silent: true,
            });
        })
            .then((result) => {
            const msg = `Created: ${result.worktreeName}`;
            setMessage(msg);
            options.onMessage?.(msg);
            options.onCreated?.();
        })
            .catch((err) => {
            const msg = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
            setMessage(msg);
            options.onMessage?.(msg);
        });
        // Return immediately
        setState("idle");
    }, [base, description, options]);
    const cancel = useCallback(() => {
        setState("idle");
        setBase("");
        setDescription("");
        setProvider("cursor");
    }, []);
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
    const setDescriptionNormalized = useCallback((desc) => {
        setDescription(normalizeDescription(desc));
    }, []);
    return {
        state,
        active,
        base,
        description,
        provider,
        message,
        start,
        setDescription: setDescriptionNormalized,
        selectBase,
        submitDescription,
        selectProvider,
        cancel,
        handleInput,
    };
}
export const baseOptions = Object.keys(WORKTREE_CONFIGS).map((key) => ({
    label: key,
    value: key,
}));
export const providerOptions = [
    { label: "Cursor (GUI)", value: "cursor" },
    { label: "Claude Code (TMUX)", value: "claude" },
    { label: "Cursor CLI (TMUX)", value: "cursor-cli" },
];
