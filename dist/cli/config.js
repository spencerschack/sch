import { join } from "node:path";
import { exists } from "../utils.js";
import { WORKTREES_DIR } from "../worktree/paths.js";
import { readWorktreeConfig, writeWorktreeConfig, removeWorktreeConfig } from "../worktree/config.js";
import { getBentoCommit } from "../git.js";
const VALID_ACTIONS = ["pause", "unpause", "remove", "qa", "depends", "undepends", "provider"];
const VALID_PROVIDERS = ["cursor", "claude", "cursor-cli"];
export async function main(args = process.argv.slice(2)) {
    const [worktreeName, action, argValue] = args;
    if (!worktreeName || !action) {
        console.error("Usage: sch config <worktree-name> <action> [value]");
        console.error("");
        console.error("Actions:");
        console.error("  pause                     Pause the worktree");
        console.error("  unpause                   Unpause the worktree");
        console.error("  remove                    Remove the config entry");
        console.error("  qa                        Record QA at current bento commit");
        console.error("  depends <name>            Add a dependency on another worktree");
        console.error("  undepends [name]          Remove a dependency (or all if no name)");
        console.error("  provider <cursor|claude|cursor-cli>  Set the agent provider");
        process.exit(1);
    }
    if (!VALID_ACTIONS.includes(action)) {
        console.error(`Unknown action: ${action}. Use one of: ${VALID_ACTIONS.join(", ")}`);
        process.exit(1);
    }
    if (action === "remove") {
        const removed = await removeWorktreeConfig(worktreeName);
        if (removed) {
            console.log(`${worktreeName}: config removed`);
        }
        else {
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
            if (!argValue) {
                console.error("Usage: sch config <worktree-name> depends <dependency-name>");
                process.exit(1);
            }
            config.dependsOn = config.dependsOn ?? [];
            if (!config.dependsOn.includes(argValue)) {
                config.dependsOn.push(argValue);
            }
            break;
        case "undepends":
            if (argValue) {
                config.dependsOn = (config.dependsOn ?? []).filter((d) => d !== argValue);
                if (config.dependsOn.length === 0) {
                    delete config.dependsOn;
                }
            }
            else {
                delete config.dependsOn;
            }
            break;
        case "provider":
            if (!argValue) {
                console.error(`Usage: sch config <worktree-name> provider <${VALID_PROVIDERS.join("|")}>`);
                process.exit(1);
            }
            if (!VALID_PROVIDERS.includes(argValue)) {
                console.error(`Invalid provider: ${argValue}. Valid options: ${VALID_PROVIDERS.join(", ")}`);
                process.exit(1);
            }
            config.agentProvider = argValue;
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
            if (argValue) {
                console.log(`${worktreeName}: removed dependency on ${argValue}`);
            }
            else {
                console.log(`${worktreeName}: all dependencies removed`);
            }
            break;
        case "provider":
            console.log(`${worktreeName}: provider set to ${config.agentProvider}`);
            break;
        default:
            console.log(`${worktreeName}: ${action}d`);
    }
}
