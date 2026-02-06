import type { PrStatus, DeployStatus } from "../../worktree/types.js";

export function getStatusColor(status: PrStatus): string | undefined {
  switch (status) {
    case "approved":
      return "green";
    case "merged":
      return "magenta";
    case "conflict":
    case "failed":
    case "expired":
      return "red";
    case "frozen":
      return "yellow";
    case "running":
      return "greenBright";
    case "queued":
      return "cyan";
    case "waiting":
    case "assign":
      return "yellow";
    default:
      return undefined;
  }
}

export function getAgentColor(status: string): string | undefined {
  switch (status) {
    case "active":
      return "green";
    case "idle":
      return "yellow";
    default:
      return undefined;
  }
}

export function getQaColor(status: string): string | undefined {
  switch (status) {
    case "testing":
      return "cyan";
    case "done":
      return "green";
    case "stale":
      return "yellow";
    default:
      return undefined;
  }
}

export function getDeployColor(status: DeployStatus): string | undefined {
  switch (status) {
    case "succeeded":
      return "green";
    case "in-progress":
    case "pending":
      return "cyan";
    case "failed":
      return "red";
    default:
      return undefined;
  }
}
