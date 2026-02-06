import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
export { useDependencies } from "./use-dependencies.js";
export function DependencyFlow({ dependencies }) {
    if (!dependencies.active) {
        return null;
    }
    return (_jsxs(Box, { children: [_jsx(Text, { children: "Depends on: " }), _jsx(SelectInput, { items: dependencies.options, onSelect: (item) => dependencies.toggle(item.value) })] }));
}
