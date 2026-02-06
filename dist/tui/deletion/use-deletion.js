import { useState, useCallback } from "react";
import { removeWorktreeFull } from "../../lifecycle/remove.js";
import { runTask } from "../tasks/runner.js";
export function useDeleteConfirm(options = {}) {
    const [state, setState] = useState("idle");
    const [worktree, setWorktree] = useState(null);
    const active = state !== "idle";
    const start = useCallback((wt) => {
        // If PR is merged, no confirmation needed - delete immediately
        if (wt.prStatus === "merged") {
            const name = wt.name;
            runTask(async (setStatus) => {
                setStatus(`Deleting ${name}...`);
                await removeWorktreeFull(name);
            })
                .then(() => {
                options.onComplete?.({ success: true, message: `Removed: ${name}` });
                options.onRefresh?.();
            })
                .catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                options.onComplete?.({ success: false, message: `Failed to remove: ${msg}` });
            });
            return;
        }
        // Otherwise, ask for confirmation
        setWorktree(wt);
        setState("confirming");
    }, [options]);
    const confirm = useCallback(async () => {
        if (!worktree) {
            return { success: false, message: "No worktree selected" };
        }
        const name = worktree.name;
        // Run delete task (fire-and-forget)
        runTask(async (setStatus) => {
            setStatus(`Deleting ${name}...`);
            await removeWorktreeFull(name);
        })
            .then(() => {
            options.onComplete?.({ success: true, message: `Removed: ${name}` });
            options.onRefresh?.();
        })
            .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            options.onComplete?.({ success: false, message: `Failed to remove: ${msg}` });
        });
        setState("idle");
        setWorktree(null);
        return { success: true, message: `Deleting ${name}...` };
    }, [worktree, options]);
    const cancel = useCallback(() => {
        setState("idle");
        setWorktree(null);
    }, []);
    const handleInput = useCallback((input, key) => {
        if (!active)
            return false;
        if (key.escape) {
            cancel();
        }
        else if (input === "y" || input === "Y") {
            confirm();
        }
        else if (input === "n" || input === "N") {
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
