import { readFile } from "node:fs/promises";
import { execAsync, exists, isMain } from "./utils.js";
import { homedir } from "node:os";
import { join } from "node:path";

interface CursorWindow {
  name: string;
  index: number;
}

interface OpenedWindow {
  folder: string;
  path: string;
  exists: boolean;
}

async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  return stdout.trim();
}

async function listWindows(): Promise<CursorWindow[]> {
  const result = await runAppleScript(
    'tell application "System Events" to get name of every window of process "Cursor"'
  );
  if (!result) return [];
  return result.split(", ").map((name, index) => ({ name, index: index + 1 }));
}

async function minimizeWindow(pattern: string): Promise<string[]> {
  const script = `
tell application "System Events"
    tell process "Cursor"
        set minimized to {}
        repeat with w in windows
            if name of w contains "${pattern}" then
                set value of attribute "AXMinimized" of w to true
                set end of minimized to name of w
            end if
        end repeat
        return minimized
    end tell
end tell`;
  const result = await runAppleScript(script);
  return result ? result.split(", ") : [];
}

async function restoreWindow(pattern: string): Promise<string[]> {
  const script = `
tell application "System Events"
    tell process "Cursor"
        set restored to {}
        repeat with w in windows
            if name of w contains "${pattern}" then
                set value of attribute "AXMinimized" of w to false
                set end of restored to name of w
            end if
        end repeat
        return restored
    end tell
end tell`;
  const result = await runAppleScript(script);
  return result ? result.split(", ") : [];
}

async function focusWindow(pattern: string): Promise<string | null> {
  const script = `
tell application "System Events"
    tell process "Cursor"
        repeat with w in windows
            if name of w contains "${pattern}" then
                perform action "AXRaise" of w
                set frontmost to true
                return name of w
            end if
        end repeat
        return ""
    end tell
end tell`;
  const result = await runAppleScript(script);
  return result || null;
}

export async function closeWindow(pattern: string): Promise<string[]> {
  const script = `
tell application "Cursor"
    activate
end tell

tell application "System Events"
    tell process "Cursor"
        set closed to {}
        repeat with i from (count of windows) to 1 by -1
            set w to window i
            if name of w contains "${pattern}" then
                set wName to name of w
                perform action "AXRaise" of w
                delay 0.2
                keystroke "w" using {command down, shift down}
                delay 0.3
                set end of closed to wName
            end if
        end repeat
        return closed
    end tell
end tell`;
  const result = await runAppleScript(script);
  return result ? result.split(", ") : [];
}

async function getOpenedWindows(): Promise<OpenedWindow[]> {
  const storagePath = join(
    homedir(),
    "Library/Application Support/Cursor/User/globalStorage/storage.json"
  );

  if (!(await exists(storagePath))) {
    return [];
  }

  const data = JSON.parse(await readFile(storagePath, "utf-8"));
  const windowsState = data.windowsState ?? {};
  const allWindows = [...(windowsState.openedWindows ?? [])];

  if (windowsState.lastActiveWindow) {
    allWindows.push(windowsState.lastActiveWindow);
  }

  const seen = new Set<string>();
  const windows: OpenedWindow[] = [];

  for (const w of allWindows) {
    const folder = w.folder ?? "";
    if (!folder.startsWith("file://")) continue;

    const path = decodeURIComponent(folder.replace("file://", ""));
    if (seen.has(path)) continue;
    seen.add(path);

    windows.push({
      folder,
      path,
      exists: await exists(path),
    });
  }

  return windows;
}

async function findMissingWindows(): Promise<OpenedWindow[]> {
  const windows = await getOpenedWindows();
  return windows.filter((w) => !w.exists);
}

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
