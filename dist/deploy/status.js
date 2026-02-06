import { execAsync } from "../utils.js";
import { BENTO_DIR } from "../worktree/paths.js";
/**
 * Parse the output of `isc deploys` command.
 * Output format is a table with columns: service, environment, deploy, time, user, build, status, ...
 * The build column contains "service@sha".
 */
function parseDeploysOutput(output) {
    const lines = output.trim().split("\n");
    // Skip header line and any warning messages
    const dataLines = lines.filter(line => {
        // Skip empty lines, warnings, and the header
        if (!line.trim())
            return false;
        if (line.startsWith("The --detail option"))
            return false;
        if (line.startsWith("service "))
            return false;
        return true;
    });
    const entries = [];
    for (const line of dataLines) {
        // Split by whitespace, but we need to be careful with the columns
        // Format: service  environment  deploy  time  user  build  status  desired  running  healthy
        const parts = line.trim().split(/\s+/);
        // Find the build column (contains @) and the status column (after build)
        let buildIndex = -1;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].includes("@")) {
                buildIndex = i;
                break;
            }
        }
        if (buildIndex === -1)
            continue;
        const build = parts[buildIndex];
        const status = parts[buildIndex + 1];
        // Extract SHA from build (format: service@sha)
        const atIndex = build.lastIndexOf("@");
        if (atIndex === -1)
            continue;
        const commitSha = build.substring(atIndex + 1);
        entries.push({ commitSha, status });
    }
    return entries;
}
/**
 * Check if a commit is an ancestor of another commit.
 * Uses `git merge-base --is-ancestor`.
 */
async function isAncestor(ancestor, descendant) {
    try {
        await execAsync(`git -C "${BENTO_DIR}" merge-base --is-ancestor ${ancestor} ${descendant}`);
        return true;
    }
    catch {
        // Exit code 1 means not an ancestor, other errors also treated as false
        return false;
    }
}
/**
 * Map isc deploy status to our DeployStatus type.
 * - pending, in-progress, succeeded, failed are mapped directly
 * - collected means the deploy was replaced, but commit was deployed (treat as succeeded)
 * - removing is treated as in-progress
 */
function mapDeployStatus(iscStatus) {
    switch (iscStatus) {
        case "pending":
            return "pending";
        case "in-progress":
        case "removing":
            return "in-progress";
        case "succeeded":
        case "collected":
            return "succeeded";
        case "failed":
            return "failed";
        default:
            return "none";
    }
}
/**
 * Fetch deploy status for a service and commit.
 * Checks if the commit (or any commit containing it) has been deployed.
 */
export async function fetchDeployStatus(service, commitSha) {
    try {
        const { stdout } = await execAsync(`isc deploys -e production ${service} --count 20`);
        const entries = parseDeploysOutput(stdout);
        // Check each deployed commit, starting with most recent
        for (const entry of entries) {
            // First try exact match (faster)
            if (commitSha.startsWith(entry.commitSha) || entry.commitSha.startsWith(commitSha.substring(0, 7))) {
                return mapDeployStatus(entry.status);
            }
            // Check if our commit is an ancestor of the deployed commit
            // This handles bundled deployments
            const isCommitDeployed = await isAncestor(commitSha, entry.commitSha);
            if (isCommitDeployed) {
                return mapDeployStatus(entry.status);
            }
        }
        return "none";
    }
    catch {
        // isc command failed, return none
        return "none";
    }
}
