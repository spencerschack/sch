import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
export { useDeleteConfirm } from "./use-deletion.js";
export function DeletionFlow({ deletion }) {
    if (!deletion.active || !deletion.worktree) {
        return null;
    }
    if (deletion.state === "deleting") {
        return (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: _jsx(Spinner, { type: "dots" }) }), _jsxs(Text, { children: [" Removing ", deletion.worktree.name, "..."] })] }));
    }
    if (deletion.state === "confirming") {
        return (_jsx(Box, { children: _jsxs(Text, { children: ["Delete ", _jsx(Text, { color: "yellow", children: deletion.worktree.name }), " without merged PR? (", _jsx(Text, { color: "cyan", children: "y" }), "/", _jsx(Text, { color: "cyan", children: "n" }), ")"] }) }));
    }
    return null;
}
