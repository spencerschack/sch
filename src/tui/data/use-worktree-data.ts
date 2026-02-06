import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { LocalWorktreeInfo, RemoteWorktreeInfo, WorktreeInfo } from "../../worktree/types.js";
import { fetchAllLocalWorktreeInfo } from "../../data/local.js";
import { fetchAllRemoteWorktreeInfo } from "../../data/remote.js";
import { mergeWorktreeData, sortWorktrees } from "../../data/merge.js";
import { runTask } from "../tasks/runner.js";

const LOCAL_REFRESH_INTERVAL = 5000; // 5 seconds
const REMOTE_REFRESH_INTERVAL = 60000; // 1 minute

export interface WorktreeDataResult {
  worktrees: WorktreeInfo[];
  lastRemoteRefresh: Date | null;
  refresh: () => Promise<void>;
  refreshLocal: () => Promise<LocalWorktreeInfo[]>;
}

export function useWorktreeData(paused: boolean): WorktreeDataResult {
  const [localData, setLocalData] = useState<LocalWorktreeInfo[]>([]);
  const [remoteData, setRemoteData] = useState<Map<string, RemoteWorktreeInfo>>(new Map());
  const [lastRemoteRefresh, setLastRemoteRefresh] = useState<Date | null>(null);

  const refreshLocal = useCallback(async () => {
    const local = await fetchAllLocalWorktreeInfo();
    setLocalData(local);
    return local;
  }, []);

  const refreshRemote = useCallback(async (names: string[]) => {
    if (names.length === 0) return;
    const remote = await fetchAllRemoteWorktreeInfo(names);
    setRemoteData(remote);
    setLastRemoteRefresh(new Date());
  }, []);

  const refresh = useCallback(async () => {
    await runTask(async (setStatus) => {
      setStatus("Refreshing...");
      const local = await fetchAllLocalWorktreeInfo();
      setLocalData(local);
      const remote = await fetchAllRemoteWorktreeInfo(local.map((l) => l.name));
      setRemoteData(remote);
      setLastRemoteRefresh(new Date());
    });
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic local refresh (fast, every 5 seconds)
  useEffect(() => {
    if (paused) return;
    const id = setInterval(refreshLocal, LOCAL_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refreshLocal, paused]);

  // Periodic remote refresh (slow, every 60 seconds)
  useEffect(() => {
    if (paused) return;
    const names = localData.map((l) => l.name);
    if (names.length === 0) return;
    const id = setInterval(() => refreshRemote(names), REMOTE_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refreshRemote, localData, paused]);

  // Refresh when becoming unpaused (regaining focus)
  const prevPaused = useRef(paused);
  useEffect(() => {
    if (!paused && prevPaused.current) {
      refresh();
    }
    prevPaused.current = paused;
  }, [paused, refresh]);

  // Merge local and remote data
  const worktrees = useMemo(() => {
    const merged = mergeWorktreeData(localData, remoteData);
    return sortWorktrees(merged);
  }, [localData, remoteData]);

  return { worktrees, lastRemoteRefresh, refresh, refreshLocal };
}
