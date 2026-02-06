import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { CURSOR_PROJECTS_DIR } from "../worktree/paths.js";
import { exists } from "../utils.js";
import type { AgentStatusResult } from "../worktree/types.js";

const IDLE_THRESHOLD_SECONDS = 30;

export async function getAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
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
