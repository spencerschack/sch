export function getStatusColor(status) {
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
export function getAgentColor(status) {
    switch (status) {
        case "active":
            return "green";
        case "idle":
            return "yellow";
        default:
            return undefined;
    }
}
export function getQaColor(status) {
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
export function getDeployColor(status) {
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
