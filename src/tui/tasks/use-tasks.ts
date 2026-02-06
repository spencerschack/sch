import { useState, useEffect } from "react";
import { listTasks, onTaskUpdate, type Task } from "./runner.js";

export function useTasks(): Task[] {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const update = () => setTasks(listTasks());
    update();
    return onTaskUpdate(update);
  }, []);

  return tasks;
}
