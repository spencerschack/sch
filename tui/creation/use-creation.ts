import { useState, useCallback } from "react";
import { createWorktree, WORKTREE_CONFIGS } from "../../worktree-new.js";

export type CreationState = "idle" | "selectingBase" | "enteringDescription" | "creating";

export interface CreationResult {
  state: CreationState;
  active: boolean;
  base: string;
  description: string;
  message: string | null;
  start: () => void;
  setDescription: (desc: string) => void;
  selectBase: (base: string) => void;
  submitDescription: () => Promise<void>;
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
  const [message, setMessage] = useState<string | null>(null);

  const active = state !== "idle";

  const start = useCallback(() => {
    setState("selectingBase");
    setBase("");
    setDescription("");
    setMessage(null);
  }, []);

  const selectBase = useCallback((selectedBase: string) => {
    setBase(selectedBase);
    setDescription("");
    setState("enteringDescription");
  }, []);

  const submitDescription = useCallback(async () => {
    const desc = description.trim().replace(/\s+/g, "-").toLowerCase();
    if (!desc) {
      const msg = "Description cannot be empty";
      setMessage(msg);
      options.onMessage?.(msg);
      setState("idle");
      return;
    }

    setState("creating");

    try {
      const result = await createWorktree(base, desc);
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
  }, []);

  // Handle input - returns true if handled
  const handleInput = useCallback((input: string, key: { escape?: boolean }): boolean => {
    if (!active) return false;

    if (key.escape) {
      cancel();
      return true;
    }

    return false;
  }, [active, cancel]);

  return {
    state,
    active,
    base,
    description,
    message,
    start,
    setDescription,
    selectBase,
    submitDescription,
    cancel,
    handleInput,
  };
}

export const baseOptions = Object.keys(WORKTREE_CONFIGS).map((key) => ({
  label: key,
  value: key,
}));
