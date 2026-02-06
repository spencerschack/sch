import { useState, useCallback } from "react";
import type { WorktreeInfo } from "../../worktree/types.js";
import { removeWorktreeFull } from "../../lifecycle/remove.js";
import type { ActionResult } from "../actions/open.js";

export type DeleteState = "idle" | "confirming" | "deleting";

export interface DeleteConfirmResult {
  state: DeleteState;
  active: boolean;
  worktree: WorktreeInfo | null;
  start: (wt: WorktreeInfo) => void;
  confirm: () => Promise<ActionResult>;
  cancel: () => void;
  handleInput: (input: string, key: { escape?: boolean }) => boolean;
}

export interface UseDeleteConfirmOptions {
  onComplete?: (result: ActionResult) => void;
  onRefresh?: () => void;
}

export function useDeleteConfirm(options: UseDeleteConfirmOptions = {}): DeleteConfirmResult {
  const [state, setState] = useState<DeleteState>("idle");
  const [worktree, setWorktree] = useState<WorktreeInfo | null>(null);

  const active = state !== "idle";

  const start = useCallback((wt: WorktreeInfo) => {
    // If PR is merged, no confirmation needed - delete immediately
    if (wt.prStatus === "merged") {
      setWorktree(wt);
      setState("deleting");
      removeWorktreeFull(wt.name)
        .then(() => {
          options.onComplete?.({ success: true, message: `Removed: ${wt.name}` });
          options.onRefresh?.();
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          options.onComplete?.({ success: false, message: `Failed to remove: ${msg}` });
        })
        .finally(() => {
          setState("idle");
          setWorktree(null);
        });
      return;
    }
    // Otherwise, ask for confirmation
    setWorktree(wt);
    setState("confirming");
  }, [options]);

  const confirm = useCallback(async (): Promise<ActionResult> => {
    if (!worktree) {
      return { success: false, message: "No worktree selected" };
    }

    setState("deleting");

    try {
      await removeWorktreeFull(worktree.name);
      const result = { success: true, message: `Removed: ${worktree.name}` };
      setState("idle");
      setWorktree(null);
      options.onComplete?.(result);
      options.onRefresh?.();
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const result = { success: false, message: `Failed to remove: ${msg}` };
      setState("idle");
      setWorktree(null);
      options.onComplete?.(result);
      return result;
    }
  }, [worktree, options]);

  const cancel = useCallback(() => {
    setState("idle");
    setWorktree(null);
  }, []);

  const handleInput = useCallback((input: string, key: { escape?: boolean }): boolean => {
    if (!active) return false;

    if (key.escape) {
      cancel();
    } else if (input === "y" || input === "Y") {
      confirm();
    } else if (input === "n" || input === "N") {
      cancel();
    }

    // Always consume input when modal is active
    return true;
  }, [active, cancel, confirm]);

  return {
    state,
    active,
    worktree,
    start,
    confirm,
    cancel,
    handleInput,
  };
}
