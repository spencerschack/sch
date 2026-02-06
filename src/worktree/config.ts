import { readFile, writeFile } from "node:fs/promises";
import { CONFIG_PATH } from "./paths.js";
import { exists } from "../utils.js";

export type AgentProvider = "cursor" | "claude" | "cursor-cli";

export interface WorktreeConfig {
  paused?: boolean;
  qaCommit?: string;
  dependsOn?: string[];
  agentProvider?: AgentProvider;
}

export interface AllWorktreeConfigs {
  [worktreeName: string]: WorktreeConfig;
}

export async function readAllConfigs(): Promise<AllWorktreeConfigs> {
  if (!(await exists(CONFIG_PATH))) return {};
  const content = await readFile(CONFIG_PATH, "utf-8");
  return JSON.parse(content);
}

export async function writeAllConfigs(configs: AllWorktreeConfigs): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(configs, null, 2) + "\n");
}

export async function readWorktreeConfig(worktreeName: string): Promise<WorktreeConfig> {
  const configs = await readAllConfigs();
  return configs[worktreeName] ?? {};
}

export async function writeWorktreeConfig(worktreeName: string, config: WorktreeConfig): Promise<void> {
  const configs = await readAllConfigs();
  configs[worktreeName] = config;
  await writeAllConfigs(configs);
}

export async function removeWorktreeConfig(worktreeName: string): Promise<boolean> {
  const configs = await readAllConfigs();
  if (!(worktreeName in configs)) return false;
  delete configs[worktreeName];
  await writeAllConfigs(configs);
  return true;
}
