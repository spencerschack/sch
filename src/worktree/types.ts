import type { AgentProvider } from "./config.js";

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
  | "conflict"
  | "failed"
  | "expired"
  | "frozen"
  | "waiting"
  | "running"
  | "merging"
  | "queued"
  | "merged"
  | "closed";

export type DeployStatus =
  | "loading"
  | "none"
  | "pending"
  | "in-progress"
  | "succeeded"
  | "failed";

export interface LocalWorktreeInfo {
  name: string;
  agentProvider: AgentProvider;
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
  assignUrl: string | null;
  commitSha: string | null;
  deployStatus: DeployStatus;
}

export interface WorktreeInfo extends LocalWorktreeInfo, RemoteWorktreeInfo {}
