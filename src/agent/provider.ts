import { join } from "node:path";
import { spawnSync } from "node:child_process";
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
        `tmux new-session -Ads "${worktreeName}" -c "${workingDir}" "claude --dangerously-skip-permissions"`
      );
      break;
    case "cursor-cli":
      await execAsync(
        `tmux new-session -Ads "${worktreeName}" -c "${workingDir}" "cursor agent chat"`
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
    case "cursor-cli": {
      // Determine the agent command based on provider
      const agentCmd = provider === "claude" ? "claude --dangerously-skip-permissions" : "cursor agent chat";
      // Run tmux directly - takes over the current terminal
      spawnSync("tmux", ["new-session", "-As", worktreeName, "-c", workingDir, agentCmd], {
        stdio: "inherit",
      });
      break;
    }
  }
}
