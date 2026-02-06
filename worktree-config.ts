import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { exists, isMain } from "./utils.js";
import { getBentoCommit } from "./git.js";

export const WORKTREES_DIR = join(homedir(), "worktrees");
export const CONFIG_PATH = join(WORKTREES_DIR, ".worktree-config");

export interface WorktreeConfig {
  paused?: boolean;
  qaCommit?: string;
  dependsOn?: string[];
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

const VALID_ACTIONS = ["pause", "unpause", "remove", "qa", "depends", "undepends"] as const;
type Action = typeof VALID_ACTIONS[number];

async function main() {
  const [worktreeName, action, dependencyName] = process.argv.slice(2);

  if (!worktreeName || !action) {
    console.error("Usage: npm run worktree-config <worktree-name> <pause|unpause|remove|qa|depends|undepends> [dependency-name]");
    process.exit(1);
  }

  if (!VALID_ACTIONS.includes(action as Action)) {
    console.error(`Unknown action: ${action}. Use one of: ${VALID_ACTIONS.join(", ")}`);
    process.exit(1);
  }

  if (action === "remove") {
    const removed = await removeWorktreeConfig(worktreeName);
    if (removed) {
      console.log(`${worktreeName}: config removed`);
    } else {
      console.log(`${worktreeName}: no config to remove`);
    }
    process.exit(0);
  }

  const worktreePath = join(WORKTREES_DIR, worktreeName);

  if (!(await exists(worktreePath))) {
    console.error(`Worktree not found: ${worktreePath}`);
    process.exit(1);
  }

  const config = await readWorktreeConfig(worktreeName);

  switch (action) {
    case "pause":
      config.paused = true;
      break;
    case "unpause":
      config.paused = false;
      break;
    case "qa":
      config.qaCommit = await getBentoCommit();
      break;
    case "depends":
      if (!dependencyName) {
        console.error("Usage: npm run worktree-config <worktree-name> depends <dependency-name>");
        process.exit(1);
      }
      config.dependsOn = config.dependsOn ?? [];
      if (!config.dependsOn.includes(dependencyName)) {
        config.dependsOn.push(dependencyName);
      }
      break;
    case "undepends":
      if (dependencyName) {
        config.dependsOn = (config.dependsOn ?? []).filter((d) => d !== dependencyName);
        if (config.dependsOn.length === 0) {
          delete config.dependsOn;
        }
      } else {
        delete config.dependsOn;
      }
      break;
  }

  await writeWorktreeConfig(worktreeName, config);

  switch (action) {
    case "qa":
      console.log(`${worktreeName}: QA recorded at ${config.qaCommit?.slice(0, 7)}`);
      break;
    case "depends":
      console.log(`${worktreeName}: now depends on ${config.dependsOn?.join(", ")}`);
      break;
    case "undepends":
      if (dependencyName) {
        console.log(`${worktreeName}: removed dependency on ${dependencyName}`);
      } else {
        console.log(`${worktreeName}: all dependencies removed`);
      }
      break;
    default:
      console.log(`${worktreeName}: ${action}d`);
  }
}

if (isMain(import.meta.url)) {
  main();
}
