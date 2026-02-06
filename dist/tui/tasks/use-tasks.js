import { useState, useEffect } from "react";
import { listTasks, onTaskUpdate } from "./runner.js";
export function useTasks() {
    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        const update = () => setTasks(listTasks());
        update();
        return onTaskUpdate(update);
    }, []);
    return tasks;
}
