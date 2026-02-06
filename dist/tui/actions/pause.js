import { readWorktreeConfig, writeWorktreeConfig } from "../../worktree/config.js";
export async function handlePause(wt) {
    const config = await readWorktreeConfig(wt.name);
    config.paused = !config.paused;
    await writeWorktreeConfig(wt.name, config);
    return { success: true, message: `${wt.name}: ${config.paused ? "paused" : "unpaused"}` };
}
