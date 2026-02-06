import { runAppleScript } from "./applescript.js";
export async function listWindows() {
    const result = await runAppleScript('tell application "System Events" to get name of every window of process "Cursor"');
    if (!result)
        return [];
    return result.split(", ").map((name, index) => ({ name, index: index + 1 }));
}
export async function minimizeWindow(pattern) {
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
export async function restoreWindow(pattern) {
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
export async function focusWindow(pattern) {
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
export async function closeWindow(pattern) {
    const script = `
tell application "System Events"
    tell process "Cursor"
        set closed to {}
        repeat with i from (count of windows) to 1 by -1
            set w to window i
            if name of w contains "${pattern}" then
                set wName to name of w
                try
                    click button 1 of w
                    delay 0.1
                end try
                set end of closed to wName
            end if
        end repeat
        return closed
    end tell
end tell`;
    const result = await runAppleScript(script);
    return result ? result.split(", ") : [];
}
