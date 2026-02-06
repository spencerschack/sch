import { useState, useCallback } from "react";
import { createWorktree, WORKTREE_CONFIGS } from "../../lifecycle/create.js";
import type { AgentProvider } from "../../worktree/config.js";

export type CreationState = "idle" | "selectingBase" | "enteringDescription" | "selectingProvider" | "creating";

export interface CreationResult {
  state: CreationState;
  active: boolean;
  base: string;
  description: string;
  provider: AgentProvider;
  message: string | null;
  start: () => void;
  setDescription: (desc: string) => void;
  selectBase: (base: string) => void;
  submitDescription: () => void;
  selectProvider: (provider: AgentProvider) => Promise<void>;
  cancel: () => void;
  handleInput: (input: string, key: { escape?: boolean }) => boolean;
}

export interface UseCreationOptions {
  onCreated?: () => Promise<unknown>;
  onMessage?: (message: string) => void;
}

export function useCreation(options: UseCreationOptions = {}): CreationResult {
  const [state, setState] = useState<CreationState>("idle");
  const [base, setBase] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<AgentProvider>("cursor");
  const [message, setMessage] = useState<string | null>(null);

  const active = state !== "idle";

  const start = useCallback(() => {
    setState("selectingBase");
    setBase("");
    setDescription("");
    setProvider("cursor");
    setMessage(null);
  }, []);

  const selectBase = useCallback((selectedBase: string) => {
    setBase(selectedBase);
    setDescription("");
    setState("enteringDescription");
  }, []);

  const submitDescription = useCallback(() => {
    const desc = description.trim().replace(/\s+/g, "-").toLowerCase();
    if (!desc) {
      const msg = "Description cannot be empty";
      setMessage(msg);
      options.onMessage?.(msg);
      setState("idle");
      return;
    }

    // Move to provider selection
    setState("selectingProvider");
  }, [description, options]);

  const selectProvider = useCallback(async (selectedProvider: AgentProvider) => {
    setProvider(selectedProvider);
    setState("creating");

    const desc = description.trim().replace(/\s+/g, "-").toLowerCase();

    try {
      const result = await createWorktree(base, desc, selectedProvider);
      const msg = `Created: ${result.worktreeName}`;
      setMessage(msg);
      options.onMessage?.(msg);
      await options.onCreated?.();
    } catch (err) {
      const msg = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
      setMessage(msg);
      options.onMessage?.(msg);
    } finally {
      setState("idle");
    }
  }, [base, description, options]);

  const cancel = useCallback(() => {
    setState("idle");
    setBase("");
    setDescription("");
    setProvider("cursor");
  }, []);

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
    state,
    active,
    base,
    description,
    provider,
    message,
    start,
    setDescription,
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

export const providerOptions: Array<{ label: string; value: AgentProvider }> = [
  { label: "Cursor (GUI)", value: "cursor" },
  { label: "Claude Code (TMUX)", value: "claude" },
  { label: "Cursor CLI (TMUX)", value: "cursor-cli" },
];
