import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useTasks } from "./use-tasks.js";
export function TaskFooter() {
    const tasks = useTasks();
    if (tasks.length === 0)
        return null;
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Running tasks:" }), tasks.map((task, i) => (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: _jsx(Spinner, { type: "dots" }) }), _jsxs(Text, { children: [" ", task.status] })] }, i)))] }));
}
