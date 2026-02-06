import { jsx as _jsx } from "react/jsx-runtime";
import { render } from "ink";
import { WorktreeApp } from "./app.js";
export async function renderTui() {
    // Check if we're in an interactive terminal
    if (!process.stdin.isTTY) {
        console.error("TUI mode requires an interactive terminal.");
        console.error("Run this command in a terminal that supports raw input.");
        process.exit(1);
    }
    // Force immediate exit on Ctrl+C to avoid waiting for pending async operations
    process.on("SIGINT", () => {
        process.exit(0);
    });
    const { waitUntilExit } = render(_jsx(WorktreeApp, {}));
    await waitUntilExit();
}
