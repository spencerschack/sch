import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
export function DependencyRow({ name, widths }) {
    const gap = "  ";
    const fullName = `└─ ${name}`;
    const namePad = fullName.padEnd(widths.name);
    const emptyAgent = "".padEnd(widths.agent);
    const emptyGit = "".padEnd(widths.git);
    const emptyQa = "".padEnd(widths.qa);
    const emptyPr = "".padEnd(widths.pr);
    return (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [" ", gap, namePad, gap, emptyAgent, gap, emptyGit, gap, emptyQa, gap, emptyPr] }) }));
}
