import type { StatusCheck } from "./types.js";

const IGNORED_CHECKS = ["semgrep-cloud-platform/scan"];

export interface CiResult {
  status: "pass" | "fail" | "running" | "expired" | "frozen";
  freezeUrl?: string;
}

export function analyzeCiStatus(checks: StatusCheck[]): CiResult {
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
