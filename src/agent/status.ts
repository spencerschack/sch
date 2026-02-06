import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { CURSOR_PROJECTS_DIR, CLAUDE_PROJECTS_DIR, WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig, type AgentProvider } from "../worktree/config.js";
import { exists, execAsync } from "../utils.js";
import type { AgentStatusResult } from "../worktree/types.js";
import { WORKTREE_CONFIGS } from "../lifecycle/create.js";

const IDLE_THRESHOLD_SECONDS = 30;

/**
 * Check if a TMUX session is running for the given worktree.
 */
export async function isTmuxSessionRunning(worktreeName: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t "${worktreeName}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the encoded project path for Claude Code.
 * Claude encodes paths by replacing / with -
 */
function getClaudeProjectPath(worktreeName: string): string {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  
  // Find the working directory based on worktree name prefix
  let workingDir = worktreePath;
  for (const [base, config] of Object.entries(WORKTREE_CONFIGS)) {
    if (worktreeName.startsWith(`${base}-`)) {
      workingDir = join(worktreePath, config.workingDir);
      break;
    }
  }
  
  // Claude encodes paths by replacing / with -
  return workingDir.replace(/\//g, "-");
}

/**
 * Check agent status for Cursor-based providers.
 */
async function getCursorAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  if (!(await exists(CURSOR_PROJECTS_DIR))) {
    return { status: "none", age: 999999 };
  }

  const projects = await readdir(CURSOR_PROJECTS_DIR);
  const match = projects.find((p) => p.includes(`worktrees-${worktreeName}`));
  if (!match) {
    return { status: "none", age: 999999 };
  }

  const transcriptsDir = join(CURSOR_PROJECTS_DIR, match, "agent-transcripts");

  if (!(await exists(transcriptsDir))) {
    return { status: "none", age: 999999 };
  }

  const entries = await readdir(transcriptsDir);
  const files = await Promise.all(
    entries
      .filter((f) => f.endsWith(".txt"))
      .map(async (f) => ({
        name: f,
        mtime: (await stat(join(transcriptsDir, f))).mtimeMs,
      }))
  );
  files.sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    return { status: "none", age: 999999 };
  }

  const ageMs = Date.now() - files[0].mtime;
  const age = Math.floor(ageMs / 1000);

  if (age < IDLE_THRESHOLD_SECONDS) {
    return { status: "active", age };
  }

  return { status: "idle", age };
}

/**
 * Check agent status for Claude Code.
 */
async function getClaudeAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  if (!(await exists(CLAUDE_PROJECTS_DIR))) {
    return { status: "none", age: 999999 };
  }

  const encodedPath = getClaudeProjectPath(worktreeName);
  const projects = await readdir(CLAUDE_PROJECTS_DIR);
  const match = projects.find((p) => p === encodedPath || p.includes(encodedPath));
  
  if (!match) {
    // Fall back to checking if TMUX session is running
    if (await isTmuxSessionRunning(worktreeName)) {
      return { status: "active", age: 0 };
    }
    return { status: "none", age: 999999 };
  }

  const projectDir = join(CLAUDE_PROJECTS_DIR, match);
  const entries = await readdir(projectDir);
  const files = await Promise.all(
    entries
      .filter((f) => f.endsWith(".jsonl"))
      .map(async (f) => ({
        name: f,
        mtime: (await stat(join(projectDir, f))).mtimeMs,
      }))
  );
  files.sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    if (await isTmuxSessionRunning(worktreeName)) {
      return { status: "active", age: 0 };
    }
    return { status: "none", age: 999999 };
  }

  const ageMs = Date.now() - files[0].mtime;
  const age = Math.floor(ageMs / 1000);

  if (age < IDLE_THRESHOLD_SECONDS) {
    return { status: "active", age };
  }

  // Check if TMUX session is still running for idle detection
  if (await isTmuxSessionRunning(worktreeName)) {
    return { status: "idle", age };
  }

  return { status: "idle", age };
}

/**
 * Get agent status for a worktree.
 * Provider-aware: checks appropriate locations based on the configured provider.
 */
export async function getAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  const config = await readWorktreeConfig(worktreeName);
  const provider: AgentProvider = config.agentProvider ?? "cursor";

  switch (provider) {
    case "cursor":
      return getCursorAgentStatus(worktreeName);
    case "cursor-cli":
      // Cursor CLI still uses Cursor's project directory for transcripts
      const cursorStatus = await getCursorAgentStatus(worktreeName);
      // Also check TMUX session for active status
      if (cursorStatus.status === "none" && await isTmuxSessionRunning(worktreeName)) {
        return { status: "active", age: 0 };
      }
      return cursorStatus;
    case "claude":
      return getClaudeAgentStatus(worktreeName);
  }
}
