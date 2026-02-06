import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { baseOptions, providerOptions } from "./use-creation.js";
export { useCreation } from "./use-creation.js";
export function CreationFlow({ creation }) {
    if (!creation.active) {
        return null;
    }
    if (creation.state === "creating") {
        return (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { children: " Creating worktree..." })] }));
    }
    if (creation.state === "selectingBase") {
        return (_jsxs(Box, { children: [_jsx(Text, { children: "Base: " }), _jsx(SelectInput, { items: baseOptions, onSelect: (item) => creation.selectBase(item.value) })] }));
    }
    if (creation.state === "enteringDescription") {
        return (_jsxs(Box, { children: [_jsxs(Text, { children: ["Description for ", creation.base, ": "] }), _jsx(TextInput, { value: creation.description, onChange: creation.setDescription, onSubmit: creation.submitDescription })] }));
    }
    if (creation.state === "selectingProvider") {
        return (_jsxs(Box, { children: [_jsxs(Text, { children: ["Provider for ", creation.description, ": "] }), _jsx(SelectInput, { items: providerOptions, onSelect: (item) => creation.selectProvider(item.value) })] }));
    }
    return null;
}
