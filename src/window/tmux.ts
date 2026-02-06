import { execAsync } from "../utils.js";

/**
 * List all TMUX sessions.
 */
export async function listTmuxSessions(): Promise<string[]> {
  try {
    const { stdout } = await execAsync("tmux list-sessions -F '#{session_name}' 2>/dev/null");
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    // tmux returns non-zero if no sessions exist
    return [];
  }
}

/**
 * Check if a TMUX session is running.
 */
export async function isTmuxSessionRunning(sessionName: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill a TMUX session.
 */
export async function killTmuxSession(sessionName: string): Promise<void> {
  await execAsync(`tmux kill-session -t "${sessionName}"`);
}

/**
 * Attach to a TMUX session (opens in iTerm).
 */
export async function attachTmuxSession(sessionName: string): Promise<void> {
  const script = `
    tell application "iTerm"
      activate
      create window with default profile command "tmux attach -t '${sessionName}'"
    end tell
  `;
  await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}
