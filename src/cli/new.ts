import { join } from "node:path";
import { access, constants } from "node:fs/promises";
import { isMain, execAsync } from "../utils.js";
import { createWorktree, runSetup, WORKTREE_CONFIGS } from "../lifecycle/create.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: npm run worktree-new <base> <description>");
    console.error(`  base: ${Object.keys(WORKTREE_CONFIGS).join(", ")}`);
    console.error("  description: kebab-case description for the branch");
    console.error("");
    console.error("Example: npm run worktree-new sage test-create-recipe-tool");
    process.exit(1);
  }

  const [base, ...descParts] = args;
  const description = descParts.join("-");

  console.log(`Fetching latest master...`);
  console.log(`Rebasing @${base} onto origin/master...`);
  console.log(`Creating worktree...`);

  const result = await createWorktree(base, description);

  // Check if script/setup exists before running it
  const setupPath = join(result.workingDir, "script", "setup");
  try {
    await access(setupPath, constants.X_OK);
    console.log(`Running script/setup in ${WORKTREE_CONFIGS[base].workingDir}...`);
    await runSetup(result.workingDir);
  } catch {
    console.log(`No script/setup found, skipping setup step.`);
  }

  console.log(`Opening Cursor at ${result.workingDir}...`);
  await execAsync(`cursor "${result.workingDir}"`);

  console.log(`\nWorktree ready: ${result.worktreeName}`);
  console.log(`Branch: ${result.branchName}`);
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
