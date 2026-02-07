import { isMain } from "../utils.js";
const COMMANDS = {
    status: {
        description: "Show worktree status table",
        run: async (args) => {
            const { main } = await import("./status.js");
            await main(args);
        },
    },
    tui: {
        description: "Open interactive TUI",
        run: async (args) => {
            const isWatch = args.includes("--watch");
            if (isWatch) {
                // For --watch mode, we need to re-exec with tsx --watch
                // This is handled by the bash shim
                console.error("--watch mode must be run via the sch wrapper script");
                process.exit(1);
            }
            const { main } = await import("./status.js");
            await main(["--tui", ...args]);
        },
    },
    new: {
        description: "Create a new worktree",
        run: async (args) => {
            const { main } = await import("./new.js");
            await main(args);
        },
    },
    config: {
        description: "Manage worktree configuration",
        run: async (args) => {
            const { main } = await import("./config.js");
            await main(args);
        },
    },
    remove: {
        description: "Remove a worktree",
        run: async (args) => {
            const { main } = await import("./remove.js");
            await main(args);
        },
    },
    next: {
        description: "Open the next worktree needing attention",
        run: async (args) => {
            const { main } = await import("./status.js");
            await main(["--next", ...args]);
        },
    },
    window: {
        description: "Manage Cursor windows",
        run: async (args) => {
            const { main } = await import("./window.js");
            await main(args);
        },
    },
    test: {
        description: "Checkout worktree in bento for QA testing",
        run: async (args) => {
            const { main } = await import("./test.js");
            await main(args);
        },
    },
};
function usage() {
    console.log("Usage: sch <command> [args]\n");
    console.log("Commands:");
    const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
    for (const [name, cmd] of Object.entries(COMMANDS)) {
        console.log(`  ${name.padEnd(maxLen + 2)}${cmd.description}`);
    }
    console.log("\nRun 'sch <command> --help' for more information on a command.");
}
export async function main(args = process.argv.slice(2)) {
    if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
        usage();
        return;
    }
    const [commandName, ...commandArgs] = args;
    if (!(commandName in COMMANDS)) {
        console.error(`Unknown command: ${commandName}\n`);
        usage();
        process.exit(1);
    }
    const command = COMMANDS[commandName];
    await command.run(commandArgs);
}
if (isMain(import.meta.url)) {
    main().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}
