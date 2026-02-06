import React from "react";
import { render } from "ink";
import { WorktreeApp } from "./app.js";

export async function renderTui(): Promise<void> {
  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.error("TUI mode requires an interactive terminal.");
    console.error("Run this command in a terminal that supports raw input.");
    process.exit(1);
  }
  
  const { waitUntilExit } = render(<WorktreeApp />, {
    exitOnCtrlC: false,
  });
  await waitUntilExit();
}
