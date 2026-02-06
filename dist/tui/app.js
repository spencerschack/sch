import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
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
// Tasks
import { runTask, useTasks, abortAllTasks, TaskFooter } from "./tasks/index.js";
export function WorktreeApp() {
    const { exit } = useApp();
    const focused = useFocused();
    const { worktrees, lastRemoteRefresh, refresh, refreshLocal } = useWorktreeData(!focused);
    const [selected, setSelected] = useState(0);
    const [message, setMessage] = useState(null);
    const [pendingExit, setPendingExit] = useState(false);
    const tasks = useTasks();
    // Handle Ctrl+C - immediate exit if no tasks, confirm if tasks running
    const handleCtrlC = () => {
        if (tasks.length === 0) {
            exit();
        }
        else if (pendingExit) {
            abortAllTasks();
            process.exit(0);
        }
        else {
            setPendingExit(true);
            setMessage(`${tasks.length} task(s) running. Ctrl+C again to quit.`);
            setTimeout(() => setPendingExit(false), 3000);
        }
    };
    // Clear message after 2 seconds
    useEffect(() => {
        if (message) {
            const id = setTimeout(() => setMessage(null), 2000);
            return () => clearTimeout(id);
        }
    }, [message]);
    // Keep selection in bounds
    useEffect(() => {
        if (worktrees.length === 0)
            return;
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
        // Handle Ctrl+C globally (before any modal handling)
        if (key.ctrl && input === "c") {
            handleCtrlC();
            return;
        }
        // Delegate to creation flow if active
        if (creation.handleInput(input, key))
            return;
        // Delegate to dependencies flow if active
        if (dependencies.handleInput(input, key))
            return;
        // Delegate to delete confirmation if active
        if (deleteConfirm.handleInput(input, key))
            return;
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
            const wt = selectedWorktree;
            runTask(async (setStatus) => {
                setStatus(`Merging ${wt.name}...`);
                return await handleMerge(wt);
            }).then((result) => {
                setMessage(result.message);
                if (result.success)
                    refresh();
            });
        }
        if (input === "p" && selectedWorktree) {
            handlePause(selectedWorktree).then((result) => {
                setMessage(result.message);
                refreshLocal();
            });
        }
        if (input === "q" && selectedWorktree) {
            const wt = selectedWorktree;
            const action = wt.qaStatus === "done" ? "Clearing" : "Processing";
            runTask(async (setStatus) => {
                setStatus(`${action} QA for ${wt.name}...`);
                return await handleQa(wt);
            }).then((result) => {
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
    // No worktrees - show TaskFooter if tasks running (initial load)
    if (worktrees.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: tasks.length === 0 ? (_jsx(Text, { children: "No worktrees found" })) : (_jsx(TaskFooter, {})) }));
    }
    // Render footer or modal input
    const renderFooterOrInput = () => {
        if (creation.active) {
            return _jsx(CreationFlow, { creation: creation });
        }
        if (dependencies.active) {
            return _jsx(DependencyFlow, { dependencies: dependencies });
        }
        if (deleteConfirm.active) {
            return _jsx(DeletionFlow, { deletion: deleteConfirm });
        }
        return (_jsx(Footer, { message: message, focused: focused, showAssign: showAssign, showMerge: showMerge }));
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(WorktreeTable, { worktrees: worktrees, selected: selected, lastRemoteRefresh: lastRemoteRefresh }), renderFooterOrInput(), _jsx(TaskFooter, {})] }));
}
