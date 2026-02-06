export interface StatusCheck {
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

export interface PrComment {
  author: { login: string };
  body: string;
}

export interface GraphQLPrData {
  state: string;
  number: number;
  mergeCommit: { oid: string } | null;
  reviewDecision: string | null;
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
  mergeQueueEntry: { state: string } | null;
  autoMergeRequest: { enabledAt: string } | null;
  comments: { nodes: PrComment[] };
  statusCheckRollup: { contexts: { nodes: StatusCheck[] } } | null;
}
