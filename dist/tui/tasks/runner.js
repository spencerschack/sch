// Module-scoped state
const tasks = new Set();
const listeners = new Set();
function notify() {
    listeners.forEach((fn) => fn());
}
export async function runTask(fn) {
    const abortController = new AbortController();
    const task = {
        status: "",
        startedAt: new Date(),
        abortController,
    };
    const setStatus = (status) => {
        task.status = status;
        notify();
    };
    tasks.add(task);
    notify();
    try {
        const result = await fn(setStatus, abortController.signal);
        return result;
    }
    finally {
        tasks.delete(task);
        notify();
    }
}
export function listTasks() {
    return [...tasks];
}
export function abortAllTasks() {
    tasks.forEach((task) => task.abortController.abort());
}
export function onTaskUpdate(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}
