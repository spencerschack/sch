import { createWorktree, WORKTREE_CONFIGS } from "../lifecycle/create.js";
import { launchAgent } from "../agent/provider.js";
const VALID_PROVIDERS = ["cursor", "claude", "cursor-cli"];
function parseArgs(args) {
    let provider = "cursor";
    const positional = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--provider" && i + 1 < args.length) {
            const value = args[++i];
            if (!VALID_PROVIDERS.includes(value)) {
                throw new Error(`Invalid provider: ${value}. Valid options: ${VALID_PROVIDERS.join(", ")}`);
            }
            provider = value;
        }
        else if (!arg.startsWith("-")) {
            positional.push(arg);
        }
    }
    if (positional.length < 2) {
        throw new Error("Missing required arguments");
    }
    const [base, ...descParts] = positional;
    return { base, description: descParts.join("-"), provider };
}
export async function main(args = process.argv.slice(2)) {
    let parsed;
    try {
        parsed = parseArgs(args);
    }
    catch {
        console.error("Usage: sch new <base> <description> [--provider <cursor|claude|cursor-cli>]");
        console.error(`  base: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
        console.error("  description: kebab-case description for the branch");
        console.error("  --provider: agent provider (default: cursor)");
        console.error("");
        console.error("Examples:");
        console.error("  sch new sage test-create-recipe-tool");
        console.error("  sch new sage my-feature --provider claude");
        process.exit(1);
    }
    const { base, description, provider } = parsed;
    console.log(`Fetching latest master...`);
    console.log(`Rebasing @${base} onto origin/master...`);
    console.log(`Creating worktree and running setup...`);
    const result = await createWorktree(base, description, { provider });
    const providerLabel = provider === "cursor" ? "Cursor" : provider === "claude" ? "Claude Code" : "Cursor CLI";
    console.log(`Launching ${providerLabel}...`);
    await launchAgent(result.worktreeName);
    console.log(`\nWorktree ready: ${result.worktreeName}`);
    console.log(`Branch: ${result.branchName}`);
    console.log(`Provider: ${providerLabel}`);
}
