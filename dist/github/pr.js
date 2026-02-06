import { execAsync } from "../utils.js";
import { analyzeCiStatus } from "./ci.js";
export async function fetchPrData(branch) {
    const query = `
    query($owner: String!, $repo: String!, $headRefName: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(headRefName: $headRefName, first: 1, states: [OPEN, MERGED, CLOSED]) {
          nodes {
            state
            number
            reviewDecision
            mergeable
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
        const { stdout } = await execAsync(`gh api graphql -f query='${query.replace(/'/g, "'\\''")}' -f owner=instacart -f repo=carrot -f headRefName='${branch.trim()}'`);
        const data = JSON.parse(stdout);
        const prs = data?.data?.repository?.pullRequests?.nodes;
        return prs?.[0] ?? null;
    }
    catch {
        return null;
    }
}
export function computePrStatus(pr) {
    const prUrl = `https://github.com/instacart/carrot/pull/${pr.number}`;
    const assignUrl = `https://pr.instacart.tools/pull-requests/mine?assignRepo=carrot&assignPr=${pr.number}`;
    if (pr.state === "MERGED")
        return { status: "merged", url: prUrl, assignUrl: null };
    if (pr.state === "CLOSED")
        return { status: "closed", url: prUrl, assignUrl: null };
    if (pr.state !== "OPEN")
        return { status: "none", url: null, assignUrl: null };
    const checks = pr.statusCheckRollup?.contexts?.nodes ?? [];
    const ciResult = analyzeCiStatus(checks);
    // Check merge queue first - if in queue, show "queued" regardless of CI status
    if (pr.mergeQueueEntry) {
        return { status: "queued", url: prUrl, assignUrl };
    }
    if (ciResult.status === "expired")
        return { status: "expired", url: prUrl, assignUrl };
    if (pr.mergeable === "CONFLICTING")
        return { status: "conflict", url: prUrl, assignUrl };
    if (ciResult.status === "fail")
        return { status: "failed", url: prUrl, assignUrl };
    if (ciResult.status === "frozen") {
        const freezeUrl = ciResult.freezeUrl ?? prUrl;
        return { status: "frozen", url: freezeUrl, assignUrl };
    }
    if (ciResult.status === "running")
        return { status: "running", url: prUrl, assignUrl };
    if (pr.reviewDecision === "APPROVED")
        return { status: "approved", url: prUrl, assignUrl };
    const comments = pr.comments?.nodes ?? [];
    const inboxComment = comments.find((c) => c.author?.login === "pr-inbox-app");
    const needsAssignment = inboxComment?.body.includes("Ready for Review?") ?? false;
    if (needsAssignment) {
        return { status: "assign", url: prUrl, assignUrl };
    }
    return { status: "waiting", url: prUrl, assignUrl };
}
export async function getPrStatus(worktreePath) {
    const { stdout: branch } = await execAsync(`git -C "${worktreePath}" rev-parse --abbrev-ref HEAD`);
    const pr = await fetchPrData(branch);
    if (!pr) {
        return { status: "none", url: null, assignUrl: null };
    }
    return computePrStatus(pr);
}
