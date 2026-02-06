import { join } from "node:path";
import { homedir } from "node:os";

export const WORKTREES_DIR = join(homedir(), "worktrees");
export const BENTO_DIR = join(homedir(), "carrot");
export const CURSOR_PROJECTS_DIR = join(homedir(), ".cursor", "projects");
export const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");
export const CONFIG_PATH = join(WORKTREES_DIR, ".worktree-config");
