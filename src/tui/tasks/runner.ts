export interface Task {
  status: string;
  startedAt: Date;
  abortController: AbortController;
}

export type SetStatus = (status: string) => void;

// Module-scoped state
const tasks = new Set<Task>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export async function runTask<T>(
  fn: (setStatus: SetStatus, signal: AbortSignal) => Promise<T>
): Promise<T> {
  const abortController = new AbortController();
  const task: Task = {
    status: "",
    startedAt: new Date(),
    abortController,
  };

  const setStatus: SetStatus = (status: string) => {
    task.status = status;
    notify();
  };

  tasks.add(task);
  notify();

  try {
    const result = await fn(setStatus, abortController.signal);
    return result;
  } finally {
    tasks.delete(task);
    notify();
  }
}

export function listTasks(): Task[] {
  return [...tasks];
}

export function abortAllTasks(): void {
  tasks.forEach((task) => task.abortController.abort());
}

export function onTaskUpdate(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
