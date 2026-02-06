import { join } from "node:path";
import { execAsync } from "../utils.js";
import { WORKTREES_DIR } from "../worktree/paths.js";
import type { PrStatus } from "../worktree/types.js";
import type { GraphQLPrData } from "./types.js";
import { analyzeCiStatus } from "./ci.js";

export interface PrStatusResult {
  status: PrStatus;
  url: string | null;
  assignUrl: string | null;
  commitSha: string | null;
}

export async function fetchPrData(branch: string): Promise<GraphQLPrData | null> {
  const query = `
    query($owner: String!, $repo: String!, $headRefName: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(headRefName: $headRefName, first: 1, states: [OPEN, MERGED, CLOSED]) {
          nodes {
            state
            number
            mergeCommit { oid }
            reviewDecision
            mergeable
            mergeQueueEntry { state }
            autoMergeRequest { enabledAt }
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

export function computePrStatus(pr: GraphQLPrData): PrStatusResult {
  const prUrl = `https://github.com/instacart/carrot/pull/${pr.number}`;
  const assignUrl = `https://pr.instacart.tools/pull-requests/mine?assignRepo=carrot&assignPr=${pr.number}`;
  // Only include commit SHA for merged PRs (the merge commit, used for deploy tracking)
  const commitSha = pr.state === "MERGED" ? pr.mergeCommit?.oid ?? null : null;

  if (pr.state === "MERGED") return { status: "merged", url: prUrl, assignUrl: null, commitSha };
  if (pr.state === "CLOSED") return { status: "closed", url: prUrl, assignUrl: null, commitSha: null };
  if (pr.state !== "OPEN") return { status: "none", url: null, assignUrl: null, commitSha: null };

  const checks = pr.statusCheckRollup?.contexts?.nodes ?? [];
  const ciResult = analyzeCiStatus(checks);

  // Check merge queue first - if in queue, show "queued" regardless of CI status
  if (pr.mergeQueueEntry) {
    return { status: "queued", url: prUrl, assignUrl, commitSha };
  }

  // Check if auto-merge is enabled
  if (pr.autoMergeRequest) {
    return { status: "merging", url: prUrl, assignUrl, commitSha };
  }

  if (ciResult.status === "expired") return { status: "expired", url: prUrl, assignUrl, commitSha };
  if (pr.mergeable === "CONFLICTING") return { status: "conflict", url: prUrl, assignUrl, commitSha };
  if (ciResult.status === "fail") return { status: "failed", url: prUrl, assignUrl, commitSha };
  if (ciResult.status === "frozen") {
    const freezeUrl = ciResult.freezeUrl ?? prUrl;
    return { status: "frozen", url: freezeUrl, assignUrl, commitSha };
  }
  if (ciResult.status === "running") return { status: "running", url: prUrl, assignUrl, commitSha };

  if (pr.reviewDecision === "APPROVED") return { status: "approved", url: prUrl, assignUrl, commitSha };

  const comments = pr.comments?.nodes ?? [];
  const inboxComment = comments.find((c) => c.author?.login === "pr-inbox-app");
  const needsAssignment = inboxComment?.body.includes("Ready for Review?") ?? false;

  if (needsAssignment) {
    return { status: "assign", url: prUrl, assignUrl, commitSha };
  }

  return { status: "waiting", url: prUrl, assignUrl, commitSha };
}

export async function getPrStatus(worktreePath: string): Promise<PrStatusResult> {
  const { stdout: branch } = await execAsync(
    `git -C "${worktreePath}" rev-parse --abbrev-ref HEAD`
  );

  const pr = await fetchPrData(branch);
  if (!pr) {
    return { status: "none", url: null, assignUrl: null, commitSha: null };
  }

  return computePrStatus(pr);
}
