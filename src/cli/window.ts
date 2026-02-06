import { isMain } from "../utils.js";
import { listWindows, minimizeWindow, restoreWindow, focusWindow, closeWindow } from "../window/operations.js";
import { findMissingWindows } from "../window/storage.js";

function printUsage(): void {
  console.log(`Usage: npm run window <command> [args]

Commands:
  list                    List all Cursor windows
  minimize <pattern>      Minimize windows matching pattern
  restore <pattern>       Restore (unminimize) windows matching pattern
  focus <pattern>         Focus/raise window matching pattern
  close <pattern>         Close windows matching pattern
  missing                 List windows with missing folders
  close-missing           Close all windows with missing folders

Examples:
  npm run window list
  npm run window minimize sage-service-location
  npm run window focus store-move
  npm run window close-missing`);
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case "list": {
      const windows = await listWindows();
      if (windows.length === 0) {
        console.log("No Cursor windows found");
      } else {
        console.log("Cursor windows:");
        for (const w of windows) {
          console.log(`  ${w.index}. ${w.name}`);
        }
      }
      break;
    }

    case "minimize": {
      const pattern = args.join(" ");
      if (!pattern) {
        console.error("Error: pattern required");
        process.exit(1);
      }
      const minimized = await minimizeWindow(pattern);
      if (minimized.length === 0) {
        console.log(`No windows matching "${pattern}" found`);
      } else {
        console.log(`Minimized ${minimized.length} window(s):`);
        for (const name of minimized) {
          console.log(`  - ${name}`);
        }
      }
      break;
    }

    case "restore": {
      const pattern = args.join(" ");
      if (!pattern) {
        console.error("Error: pattern required");
        process.exit(1);
      }
      const restored = await restoreWindow(pattern);
      if (restored.length === 0) {
        console.log(`No windows matching "${pattern}" found`);
      } else {
        console.log(`Restored ${restored.length} window(s):`);
        for (const name of restored) {
          console.log(`  - ${name}`);
        }
      }
      break;
    }

    case "focus": {
      const pattern = args.join(" ");
      if (!pattern) {
        console.error("Error: pattern required");
        process.exit(1);
      }
      const focused = await focusWindow(pattern);
      if (focused) {
        console.log(`Focused: ${focused}`);
      } else {
        console.log(`No window matching "${pattern}" found`);
      }
      break;
    }

    case "close": {
      const pattern = args.join(" ");
      if (!pattern) {
        console.error("Error: pattern required");
        process.exit(1);
      }
      const closed = await closeWindow(pattern);
      if (closed.length === 0) {
        console.log(`No windows matching "${pattern}" found`);
      } else {
        console.log(`Closed ${closed.length} window(s):`);
        for (const name of closed) {
          console.log(`  - ${name}`);
        }
      }
      break;
    }

    case "missing": {
      const missing = await findMissingWindows();
      if (missing.length === 0) {
        console.log("No windows with missing folders");
      } else {
        console.log(`Windows with missing folders (${missing.length}):`);
        for (const w of missing) {
          console.log(`  - ${w.path}`);
        }
      }
      break;
    }

    case "close-missing": {
      const missing = await findMissingWindows();
      if (missing.length === 0) {
        console.log("No windows with missing folders");
        break;
      }

      console.log(`Found ${missing.length} window(s) with missing folders:`);
      for (const w of missing) {
        console.log(`  - ${w.path}`);
      }

      let closedCount = 0;
      for (const w of missing) {
        const worktreeName = w.path.match(/worktrees\/([^/]+)/)?.[1];
        if (worktreeName) {
          const closed = await closeWindow(worktreeName);
          closedCount += closed.length;
        }
      }

      console.log(`\nClosed ${closedCount} window(s)`);
      break;
    }

    default:
      printUsage();
      if (command && command !== "help" && command !== "--help") {
        process.exit(1);
      }
  }
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
