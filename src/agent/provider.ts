import { join } from "node:path";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig, type AgentProvider } from "../worktree/config.js";
import { WORKTREE_CONFIGS } from "../lifecycle/create.js";
import { execAsync } from "../utils.js";

/**
 * Gets the working directory for a worktree based on its config.
 */
export async function getWorktreeWorkingDir(worktreeName: string): Promise<string> {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const config = await readWorktreeConfig(worktreeName);
  const baseConfig = WORKTREE_CONFIGS[config.base];
  
  if (baseConfig) {
    return join(worktreePath, baseConfig.workingDir);
  }
  
  return worktreePath;
}

/**
 * Gets the agent provider for a worktree.
 */
export async function getAgentProvider(worktreeName: string): Promise<AgentProvider> {
  const config = await readWorktreeConfig(worktreeName);
  return config.agentProvider;
}

/**
 * Launches the agent for this worktree.
 * For Cursor: opens the GUI
 * For Claude/Cursor CLI: creates a new TMUX session
 */
export async function launchAgent(worktreeName: string): Promise<void> {
  const provider = await getAgentProvider(worktreeName);
  const workingDir = await getWorktreeWorkingDir(worktreeName);

  switch (provider) {
    case "cursor":
      await execAsync(`cursor "${workingDir}"`);
      break;
    case "claude":
      await execAsync(
        `tmux new-session -d -s "${worktreeName}" -c "${workingDir}" "claude"`
      );
      break;
    case "cursor-cli":
      await execAsync(
        `tmux new-session -d -s "${worktreeName}" -c "${workingDir}" "agent chat"`
      );
      break;
  }
}

/**
 * Opens/attaches to an existing agent session.
 * For Cursor: opens via cursor:// URL
 * For Claude/Cursor CLI: opens Terminal.app and attaches to TMUX session
 */
export async function openAgent(worktreeName: string): Promise<void> {
  const provider = await getAgentProvider(worktreeName);
  const workingDir = await getWorktreeWorkingDir(worktreeName);

  switch (provider) {
    case "cursor":
      await execAsync(`open "cursor://file/${workingDir}"`);
      break;
    case "claude":
    case "cursor-cli":
      // Open iTerm and attach to the TMUX session
      const script = `
        tell application "iTerm"
          activate
          create window with default profile command "tmux attach -t '${worktreeName}' 2>/dev/null || tmux new-session -s '${worktreeName}' -c '${workingDir}'"
        end tell
      `;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      break;
  }
}
