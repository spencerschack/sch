import { join } from "node:path";
import { access, constants } from "node:fs/promises";
import { isMain } from "../utils.js";
import { createWorktree, runSetup, WORKTREE_CONFIGS } from "../lifecycle/create.js";
import { launchAgent } from "../agent/provider.js";
import type { AgentProvider } from "../worktree/config.js";

const VALID_PROVIDERS: AgentProvider[] = ["cursor", "claude", "cursor-cli"];

function parseArgs(args: string[]): { base: string; description: string; provider: AgentProvider } {
  let provider: AgentProvider = "cursor";
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--provider" && i + 1 < args.length) {
      const value = args[++i] as AgentProvider;
      if (!VALID_PROVIDERS.includes(value)) {
        throw new Error(`Invalid provider: ${value}. Valid options: ${VALID_PROVIDERS.join(", ")}`);
      }
      provider = value;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    throw new Error("Missing required arguments");
  }

  const [base, ...descParts] = positional;
  return { base, description: descParts.join("-"), provider };
}

async function main() {
  const args = process.argv.slice(2);

  let parsed: { base: string; description: string; provider: AgentProvider };
  try {
    parsed = parseArgs(args);
  } catch {
    console.error("Usage: npm run worktree-new <base> <description> [--provider <cursor|claude|cursor-cli>]");
    console.error(`  base: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
    console.error("  description: kebab-case description for the branch");
    console.error("  --provider: agent provider (default: cursor)");
    console.error("");
    console.error("Examples:");
    console.error("  npm run worktree-new sage test-create-recipe-tool");
    console.error("  npm run worktree-new sage my-feature --provider claude");
    process.exit(1);
  }

  const { base, description, provider } = parsed;

  console.log(`Fetching latest master...`);
  console.log(`Rebasing @${base} onto origin/master...`);
  console.log(`Creating worktree...`);

  const result = await createWorktree(base, description, provider);

  // Check if script/setup exists before running it
  const setupPath = join(result.workingDir, "script", "setup");
  try {
    await access(setupPath, constants.X_OK);
    console.log(`Running script/setup in ${WORKTREE_CONFIGS[base].workingDir}...`);
    await runSetup(result.workingDir);
  } catch {
    console.log(`No script/setup found, skipping setup step.`);
  }

  const providerLabel = provider === "cursor" ? "Cursor" : provider === "claude" ? "Claude Code" : "Cursor CLI";
  console.log(`Launching ${providerLabel}...`);
  await launchAgent(result.worktreeName);

  console.log(`\nWorktree ready: ${result.worktreeName}`);
  console.log(`Branch: ${result.branchName}`);
  console.log(`Provider: ${providerLabel}`);
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
