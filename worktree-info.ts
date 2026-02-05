export type GitStatus = "clean" | "changed";
export type QaStatus = "testing" | "done" | "stale" | "none";

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
  | "loading"
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

export interface LocalWorktreeInfo {
  name: string;
  cursorUrl: string;
  agent: AgentStatusResult;
  git: GitStatusResult;
  paused: boolean;
  blocked: boolean;
  dependsOn: string[];
  qaStatus: QaStatus;
}

export interface RemoteWorktreeInfo {
  prStatus: PrStatus;
  prUrl: string | null;
}

export interface WorktreeInfo extends LocalWorktreeInfo, RemoteWorktreeInfo {}
