import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { WORKTREES_DIR, readWorktreeConfig, WorktreeConfig } from "./worktree-config.js";
import { execAsync, exists, isMain } from "./utils.js";
import type { AgentStatusResult, GitStatusResult, PrStatus, QaStatus, WorktreeInfo } from "./worktree-info.js";
import { isBusyStatus, renderWorktreeTable } from "./render-table.js";

const CURSOR_PROJECTS_DIR = join(homedir(), ".cursor", "projects");
const IDLE_THRESHOLD_SECONDS = 30;
const IGNORED_CHECKS = ["semgrep-cloud-platform/scan"];

interface StatusCheck {
  __typename: string;
  name?: string;
  context?: string;
  state?: string;
  conclusion?: string;
  status?: string;
  targetUrl?: string;
  detailsUrl?: string;
  description?: string;
  text?: string;
}

interface PrComment {
  author: { login: string };
  body: string;
}

interface GraphQLPrData {
  state: string;
  number: number;
  reviewDecision: string | null;
  mergeQueueEntry: { state: string } | null;
  comments: { nodes: PrComment[] };
  statusCheckRollup: { contexts: { nodes: StatusCheck[] } } | null;
}

async function getAgentStatus(worktreeName: string): Promise<AgentStatusResult> {
  if (!(await exists(CURSOR_PROJECTS_DIR))) {
    return { status: "none", age: 999999 };
  }

  const projects = await readdir(CURSOR_PROJECTS_DIR);
  const match = projects.find((p) => p.includes(`worktrees-${worktreeName}`));
  if (!match) {
    return { status: "none", age: 999999 };
  }

  const transcriptsDir = join(CURSOR_PROJECTS_DIR, match, "agent-transcripts");

  if (!(await exists(transcriptsDir))) {
    return { status: "none", age: 999999 };
  }

  const entries = await readdir(transcriptsDir);
  const files = await Promise.all(
    entries
      .filter((f) => f.endsWith(".txt"))
      .map(async (f) => ({
        name: f,
        mtime: (await stat(join(transcriptsDir, f))).mtimeMs,
      }))
  );
  files.sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    return { status: "none", age: 999999 };
  }

  const ageMs = Date.now() - files[0].mtime;
  const age = Math.floor(ageMs / 1000);

  if (age < IDLE_THRESHOLD_SECONDS) {
    return { status: "active", age };
  }

  return { status: "idle", age };
}

async function getGitInfo(worktreePath: string): Promise<GitStatusResult> {
  const { stdout } = await execAsync(`git -C "${worktreePath}" status --porcelain`);
  const output = stdout.trim();
  const count = output ? output.split("\n").length : 0;
  return { status: count === 0 ? "clean" : "changed", count };
}

async function getCurrentCommit(worktreePath: string): Promise<string> {
  const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
  return stdout.trim();
}

async function getQaStatus(worktreePath: string, config: WorktreeConfig): Promise<QaStatus> {
  if (!config.qaCommit) return "none";

  const currentCommit = await getCurrentCommit(worktreePath);
  return currentCommit === config.qaCommit ? "done" : "stale";
}

async function fetchPrData(branch: string): Promise<GraphQLPrData | null> {
  const query = `
    query($owner: String!, $repo: String!, $headRefName: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(headRefName: $headRefName, first: 1, states: [OPEN, MERGED, CLOSED]) {
          nodes {
            state
            number
            reviewDecision
            mergeQueueEntry { state }
            comments(last: 50) {
              nodes {
                author { login }
                body
              }
            }
            statusCheckRollup {
              contexts(first: 50) {
                nodes {
                  __typename
                  ... on CheckRun {
                    name
                    conclusion
                    status
                    detailsUrl
                    text
                  }
                  ... on StatusContext {
                    context
                    state
                    targetUrl
                    description
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const { stdout } = await execAsync(
      `gh api graphql -f query='${query.replace(/'/g, "'\\''")}' -f owner=instacart -f repo=carrot -f headRefName='${branch.trim()}'`
    );
    const data = JSON.parse(stdout);
    const prs = data?.data?.repository?.pullRequests?.nodes;
    return prs?.[0] ?? null;
  } catch {
    return null;
  }
}

interface CiResult {
  status: "pass" | "fail" | "running" | "expired" | "frozen";
  freezeUrl?: string;
}

function analyzeCiStatus(checks: StatusCheck[]): CiResult {
  const validChecks = checks.filter((check) => {
    const name = check.name ?? check.context ?? "";
    return !IGNORED_CHECKS.some((ignored) => name.includes(ignored));
  });

  for (const check of validChecks) {
    const description = check.description ?? check.text ?? "";
    if (description.toLowerCase().includes("expired")) {
      return { status: "expired" };
    }
  }

  const pending = validChecks.some((check) => {
    return check.state === "PENDING" || check.status === "IN_PROGRESS" || check.status === "QUEUED";
  });

  if (pending) {
    return { status: "running" };
  }

  const failures = validChecks.filter((check) => {
    const isFailed = check.state === "FAILURE" || check.state === "ERROR" || check.conclusion === "FAILURE";
    const name = check.name ?? check.context ?? "";
    const isCodeFreeze = name.includes("ISC code freeze");
    return isFailed && !isCodeFreeze;
  });

  if (failures.length > 0) {
    return { status: "fail" };
  }

  const freezeCheck = validChecks.find((check) => {
    const name = check.name ?? check.context ?? "";
    const isFailed = check.state === "FAILURE" || check.state === "ERROR" || check.conclusion === "FAILURE";
    return name.includes("ISC code freeze") && isFailed;
  });

  if (freezeCheck) {
    const freezeUrl = freezeCheck.targetUrl ?? freezeCheck.detailsUrl;
    return { status: "frozen", freezeUrl };
  }

  return { status: "pass" };
}

interface PrStatusResult {
  status: PrStatus;
  url: string | null;
}

function getPrPriority(status: PrStatus): number {
  switch (status) {
    case "approved": return 1;
    case "assign": return 2;
    case "failed": return 3;
    case "expired": return 4;
    case "frozen": return 5;
    case "none": return 6;
    case "waiting": return 7;
    case "running": return 8;
    case "merged": return 9;
    case "queued": return 9;
    case "closed": return 10;
  }
}

function computePrStatus(pr: GraphQLPrData): PrStatusResult {
  const prUrl = `https://github.com/instacart/carrot/pull/${pr.number}`;
  const rereviewUrl = `https://pr.instacart.tools/pull-requests/mine?assignRepo=carrot&assignPr=${pr.number}&rereview=true`;

  if (pr.state === "MERGED") return { status: "merged", url: prUrl };
  if (pr.state === "CLOSED") return { status: "closed", url: prUrl };
  if (pr.state !== "OPEN") return { status: "none", url: null };

  const checks = pr.statusCheckRollup?.contexts?.nodes ?? [];
  const ciResult = analyzeCiStatus(checks);

  if (ciResult.status === "expired") return { status: "expired", url: prUrl };
  if (ciResult.status === "fail") return { status: "failed", url: prUrl };
  if (ciResult.status === "frozen") {
    const freezeUrl = ciResult.freezeUrl ?? prUrl;
    return { status: "frozen", url: freezeUrl };
  }
  if (ciResult.status === "running") return { status: "running", url: prUrl };

  if (pr.mergeQueueEntry) {
    return { status: "queued", url: prUrl };
  }

  if (pr.reviewDecision === "APPROVED") return { status: "approved", url: prUrl };

  const comments = pr.comments?.nodes ?? [];
  const inboxComment = comments.find((c) => c.author?.login === "pr-inbox-app");
  const needsAssignment = inboxComment?.body.includes("Ready for Review?") ?? false;

  if (needsAssignment) {
    const assignUrl = `https://pr.instacart.tools/pull-requests/mine?assignRepo=carrot&assignPr=${pr.number}`;
    return { status: "assign", url: assignUrl };
  }

  return { status: "waiting", url: rereviewUrl };
}

async function getPrStatus(worktreePath: string): Promise<PrStatusResult> {
  const { stdout: branch } = await execAsync(
    `git -C "${worktreePath}" rev-parse --abbrev-ref HEAD`
  );

  const pr = await fetchPrData(branch);
  if (!pr) {
    return { status: "none", url: null };
  }

  return computePrStatus(pr);
}

function getWorkingDirectory(worktreePath: string, name: string): string {
  if (name.startsWith("sage-")) {
    return join(worktreePath, "sage", "sage-backend");
  }
  if (name.startsWith("store-")) {
    return join(worktreePath, "customers", "store");
  }
  return worktreePath;
}

export async function processWorktree(entry: string): Promise<WorktreeInfo | null> {
  if (entry.startsWith("@")) return null;

  const worktreePath = join(WORKTREES_DIR, entry);
  if (!(await stat(worktreePath)).isDirectory()) return null;

  const agent = await getAgentStatus(entry);
  const [git, prResult, config] = await Promise.all([
    getGitInfo(worktreePath),
    getPrStatus(worktreePath),
    readWorktreeConfig(entry),
  ]);

  const qaStatus = await getQaStatus(worktreePath, config);
  const workingDir = getWorkingDirectory(worktreePath, entry);
  const cursorUrl = `cursor://file/${workingDir}`;

  return {
    name: entry,
    cursorUrl,
    agent,
    git,
    prStatus: prResult.status,
    prUrl: prResult.url,
    paused: config.paused ?? false,
    qaStatus,
  };
}

export async function openUrl(url: string): Promise<void> {
  await execAsync(`open "${url}"`);
}

function getPrPriorityValue(status: PrStatus): number {
  return getPrPriority(status);
}

export function sortWorktrees(worktrees: WorktreeInfo[]): WorktreeInfo[] {
  return [...worktrees].sort((a, b) => {
    if (a.paused !== b.paused) {
      return a.paused ? 1 : -1;
    }
    const aNeedsAttention = a.agent.status !== "active" && !isBusyStatus(a.prStatus) && !a.paused;
    const bNeedsAttention = b.agent.status !== "active" && !isBusyStatus(b.prStatus) && !b.paused;
    if (aNeedsAttention !== bNeedsAttention) {
      return aNeedsAttention ? -1 : 1;
    }
    return getPrPriorityValue(a.prStatus) - getPrPriorityValue(b.prStatus);
  });
}

export async function fetchWorktrees(): Promise<WorktreeInfo[]> {
  if (!(await exists(WORKTREES_DIR))) {
    return [];
  }

  const entries = await readdir(WORKTREES_DIR);
  const results = await Promise.all(entries.map(processWorktree));
  const worktrees = results.filter((wt): wt is WorktreeInfo => wt !== null);

  return sortWorktrees(worktrees);
}

async function main() {
  const isNext = process.argv.includes("--next");
  const isTui = process.argv.includes("--tui");

  if (isTui) {
    const { renderTui } = await import("./render-tui.js");
    await renderTui();
    return;
  }

  const worktrees = await fetchWorktrees();

  if (worktrees.length === 0) {
    console.log("No worktrees found");
    process.exit(0);
  }

  if (isNext) {
    const first = worktrees.find((wt) => wt.agent.status !== "active" && !isBusyStatus(wt.prStatus) && !wt.paused);
    if (!first) {
      console.log("No worktrees need attention");
      process.exit(0);
    }

    const needsQa = first.qaStatus === "none" || first.qaStatus === "stale";
    if (needsQa && first.prStatus !== "none") {
      console.log(`Needs QA: ${first.name}`);
      console.log(`QA Status: ${first.qaStatus}`);
      console.log(`PR: ${first.prUrl}`);
      process.exit(0);
    }

    const url = first.prUrl ?? first.cursorUrl;
    await openUrl(url);
    console.log(`Opened: ${url}`);
    process.exit(0);
  }

  renderWorktreeTable(worktrees);
}

if (isMain(import.meta.url)) {
  main();
}
