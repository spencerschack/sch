export type GitStatus = "clean" | "changed";
export type QaStatus = "done" | "stale" | "none";

export interface GitStatusResult {
  status: GitStatus;
  count: number;
}

export type AgentStatus = "none" | "active" | "idle";

export interface AgentStatusResult {
  status: AgentStatus;
  age: number;
}

export type PrStatus =
  | "none"
  | "approved"
  | "assign"
  | "failed"
  | "expired"
  | "frozen"
  | "waiting"
  | "running"
  | "queued"
  | "merged"
  | "closed";

export interface WorktreeInfo {
  name: string;
  cursorUrl: string;
  agent: AgentStatusResult;
  git: GitStatusResult;
  prStatus: PrStatus;
  prUrl: string | null;
  paused: boolean;
  qaStatus: QaStatus;
}
