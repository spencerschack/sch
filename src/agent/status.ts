import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { CURSOR_PROJECTS_DIR, CLAUDE_PROJECTS_DIR } from "../worktree/paths.js";
import { readWorktreeConfig } from "../worktree/config.js";
import { exists } from "../utils.js";
import type { AgentStatusResult } from "../worktree/types.js";
import { getWorktreeWorkingDir } from "./provider.js";

const IDLE_THRESHOLD_SECONDS = 30;

/**
 * Get the encoded project path for Claude Code.
 * Claude encodes paths by replacing / with -
 */
async function getClaudeProjectPath(worktreeName: string): Promise<string> {
  const workingDir = await getWorktreeWorkingDir(worktreeName);
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
 * Only reports status based on Claude's project files, not tmux session existence.
 */
async function getClaudeAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  if (!(await exists(CLAUDE_PROJECTS_DIR))) {
    return { status: "none", age: 999999 };
  }

  const encodedPath = await getClaudeProjectPath(worktreeName);
  const projects = await readdir(CLAUDE_PROJECTS_DIR);
  const match = projects.find((p) => p === encodedPath || p.includes(encodedPath));
  
  if (!match) {
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
 * Get agent status for a worktree.
 * Provider-aware: checks appropriate locations based on the configured provider.
 */
export async function getAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  const config = await readWorktreeConfig(worktreeName);
  const provider = config.agentProvider;

  switch (provider) {
    case "cursor":
      return getCursorAgentStatus(worktreeName);
    case "cursor-cli":
      // Cursor CLI uses Cursor's project directory for transcripts
      return getCursorAgentStatus(worktreeName);
    case "claude":
      return getClaudeAgentStatus(worktreeName);
  }
}
