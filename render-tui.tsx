import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import prettyMs from "pretty-ms";
import { fetchAllLocalWorktreeInfo, fetchAllRemoteWorktreeInfo, mergeWorktreeData, sortWorktrees, openUrl } from "./worktree-status.js";
import { writeWorktreeConfig, readWorktreeConfig, WORKTREES_DIR } from "./worktree-config.js";
import { formatAgentStatus, formatGitStatus, isBusyStatus } from "./render-table.js";
import { createWorktree, WORKTREE_CONFIGS } from "./worktree-new.js";
import { removeWorktreeFull } from "./worktree-remove.js";
import type { WorktreeInfo, PrStatus, LocalWorktreeInfo, RemoteWorktreeInfo } from "./worktree-info.js";
import { execAsync } from "./utils.js";
import { homedir } from "node:os";
import { join } from "node:path";

type InputMode = "normal" | "inputBase" | "inputDescription" | "selectDependency";

const BENTO_DIR = join(homedir(), "carrot");
const LOCAL_REFRESH_INTERVAL = 5000; // 5 seconds
const REMOTE_REFRESH_INTERVAL = 60000; // 1 minute

function useFocused() {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    // Enable focus reporting
    process.stdout.write("\x1b[?1004h");

    const handler = (data: Buffer) => {
      const str = data.toString();
      if (str.includes("\x1b[I")) setFocused(true);
      if (str.includes("\x1b[O")) setFocused(false);
    };

    process.stdin.on("data", handler);

    return () => {
      // Disable focus reporting
      process.stdout.write("\x1b[?1004l");
      process.stdin.off("data", handler);
    };
  }, []);

  return focused;
}

async function getBentoCommit(): Promise<string> {
  const { stdout } = await execAsync(`git -C "${BENTO_DIR}" rev-parse HEAD`);
  return stdout.trim();
}

async function getWorktreeCommit(worktreeName: string): Promise<string> {
  const worktreePath = join(WORKTREES_DIR, worktreeName);
  const { stdout } = await execAsync(`git -C "${worktreePath}" rev-parse HEAD`);
  return stdout.trim();
}

async function checkoutCommitInBento(commit: string): Promise<void> {
  await execAsync(`git -C "${BENTO_DIR}" checkout "${commit}" --detach`);
}

function getStatusColor(status: PrStatus): string | undefined {
  switch (status) {
    case "approved":
      return "green";
    case "merged":
      return "magenta";
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

function getAgentColor(status: string): string | undefined {
  switch (status) {
    case "active":
      return "green";
    case "idle":
      return "yellow";
    default:
      return undefined;
  }
}

function getQaColor(status: string): string | undefined {
  switch (status) {
    case "done":
      return "green";
    case "stale":
      return "yellow";
    default:
      return undefined;
  }
}

interface ColumnWidths {
  name: number;
  agent: number;
  git: number;
  qa: number;
  pr: number;
}

function getRowData(wt: WorktreeInfo) {
  const needsAttention = wt.agent.status !== "active" && !isBusyStatus(wt.prStatus) && !wt.paused && !wt.blocked;
  const attention = wt.paused ? "P" : needsAttention ? "!" : " ";
  const namePrefix = wt.blocked ? "└─ " : "";
  const agent = formatAgentStatus(wt.agent);
  const git = formatGitStatus(wt.git);
  const pr = wt.prStatus === "none" ? "-" : wt.prStatus;
  const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
  return { attention, name: wt.name, namePrefix, agent, git, qa, pr, needsAttention };
}

function computeColumnWidths(data: WorktreeInfo[]): ColumnWidths {
  const widths: ColumnWidths = {
    name: "Worktree".length,
    agent: "Agent".length,
    git: "Git".length,
    qa: "QA".length,
    pr: "PR".length,
  };

  for (const wt of data) {
    const row = getRowData(wt);
    widths.name = Math.max(widths.name, row.namePrefix.length + row.name.length);
    widths.agent = Math.max(widths.agent, row.agent.length);
    widths.git = Math.max(widths.git, row.git.length);
    widths.qa = Math.max(widths.qa, row.qa.length);
    widths.pr = Math.max(widths.pr, row.pr.length);
  }

  return widths;
}

type HighlightColumn = "agent" | "git" | "qa" | "pr" | null;

function getHighlightColumn(wt: WorktreeInfo): HighlightColumn {
  // Priority 1: PR issues that block progress
  if (wt.prStatus === "failed" || wt.prStatus === "expired" || wt.prStatus === "assign" || wt.prStatus === "frozen") {
    return "pr";
  }
  // Priority 2: Agent needs attention (idle when PR isn't busy)
  if (wt.agent.status === "idle" && !isBusyStatus(wt.prStatus)) {
    return "agent";
  }
  // Priority 3: QA is stale
  if (wt.qaStatus === "stale") {
    return "qa";
  }
  // Priority 4: Uncommitted changes
  if (wt.git.status === "changed") {
    return "git";
  }
  // Priority 5: PR is running/queued (positive status)
  if (wt.prStatus === "running" || wt.prStatus === "queued" || wt.prStatus === "approved" || wt.prStatus === "waiting") {
    return "pr";
  }
  // Priority 6: Agent is active
  if (wt.agent.status === "active") {
    return "agent";
  }
  return null;
}

interface WorktreeRowProps {
  wt: WorktreeInfo;
  selected: boolean;
  widths: ColumnWidths;
}

function WorktreeRow({ wt, selected, widths }: WorktreeRowProps) {
  const row = getRowData(wt);
  const bgColor = selected ? "whiteBright" : undefined;
  const dimmed = wt.paused || wt.blocked;
  const highlight = dimmed ? null : getHighlightColumn(wt);

  // Pad each cell to fill its column width, plus 2 for gap
  const gap = "  ";
  const attentionPad = row.attention;
  const fullName = row.namePrefix + row.name;
  const namePad = fullName.padEnd(widths.name);
  const agentPad = row.agent.padEnd(widths.agent);
  const gitPad = row.git.padEnd(widths.git);
  const qaPad = row.qa.padEnd(widths.qa);
  const prPad = row.pr.padEnd(widths.pr);

  return (
    <Box>
      <Text backgroundColor={bgColor} dimColor={dimmed}>
        <Text color={row.needsAttention ? "red" : undefined}>
          {attentionPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : "blue"} bold={selected}>
          {namePad}
        </Text>
        {gap}
        <Text color={highlight === "agent" ? getAgentColor(wt.agent.status) : undefined}>
          {agentPad}
        </Text>
        {gap}
        <Text color={highlight === "git" ? "yellow" : undefined}>
          {gitPad}
        </Text>
        {gap}
        <Text color={highlight === "qa" ? getQaColor(wt.qaStatus) : undefined}>
          {qaPad}
        </Text>
        {gap}
        <Text color={highlight === "pr" ? getStatusColor(wt.prStatus) : undefined}>
          {prPad}
        </Text>
      </Text>
    </Box>
  );
}

interface TableHeaderProps {
  widths: ColumnWidths;
  lastRemoteRefresh: Date | null;
}

function TableHeader({ widths, lastRemoteRefresh }: TableHeaderProps) {
  // Tick every second to update the time ago display
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const gap = "  ";
  const prHeader = lastRemoteRefresh
    ? `PR (${Math.floor((Date.now() - lastRemoteRefresh.getTime()) / 60000)}m)`
    : "PR";
  return (
    <Box>
      <Text dimColor>
        {" "}
        {gap}
        {"Worktree".padEnd(widths.name)}
        {gap}
        {"Agent".padEnd(widths.agent)}
        {gap}
        {"Git".padEnd(widths.git)}
        {gap}
        {"QA".padEnd(widths.qa)}
        {gap}
        {prHeader.padEnd(widths.pr)}
      </Text>
    </Box>
  );
}

interface FooterProps {
  refreshing: boolean;
  message: string | null;
  focused: boolean;
  showDelete: boolean;
}

function Footer({ refreshing, message, focused, showDelete }: FooterProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>
        <Text color="cyan">↵</Text>{" Cursor   "}
        <Text color="cyan">⇥</Text>{" PR   "}
        {showDelete && <><Text color="cyan">⌫</Text>{" Delete   "}</>}
        <Text color="cyan">P</Text>{"ause   "}
        <Text color="cyan">D</Text>{"ep   "}
        <Text color="cyan">Q</Text>{"A   "}
        <Text color="cyan">R</Text>{"efresh   "}
        <Text color="cyan">N</Text>{"ew"}
      </Text>
      {message ? (
        <Text color="green">{message}</Text>
      ) : refreshing ? (
        <Text color="cyan">Refreshing...</Text>
      ) : !focused ? (
        <Text color="yellow">Paused (unfocused)</Text>
      ) : null}
    </Box>
  );
}

function useWorktreeData(paused: boolean) {
  const [localData, setLocalData] = useState<LocalWorktreeInfo[]>([]);
  const [remoteData, setRemoteData] = useState<Map<string, RemoteWorktreeInfo>>(new Map());
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const local = await refreshLocal();
      await refreshRemote(local.map((l) => l.name));
    } finally {
      setLoading(false);
    }
  }, [refreshLocal, refreshRemote]);

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
  const prevPaused = React.useRef(paused);
  useEffect(() => {
    if (!paused && prevPaused.current) {
      refresh();
    }
    prevPaused.current = paused;
  }, [paused, refresh]);

  // Merge local and remote data
  const data = React.useMemo(() => {
    const merged = mergeWorktreeData(localData, remoteData);
    return sortWorktrees(merged);
  }, [localData, remoteData]);

  return { data, loading, lastRemoteRefresh, refresh, refreshLocal };
}

function WorktreeApp() {
  const { exit } = useApp();
  const focused = useFocused();
  const { data, loading, lastRemoteRefresh, refresh, refreshLocal } = useWorktreeData(!focused);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Input mode for creating new worktrees
  const [inputMode, setInputMode] = useState<InputMode>("normal");
  const [newWorktreeBase, setNewWorktreeBase] = useState("");
  const [newWorktreeDesc, setNewWorktreeDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Clear message after 2 seconds
  useEffect(() => {
    if (message) {
      const id = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(id);
    }
  }, [message]);

  // Keep selection in bounds
  useEffect(() => {
    if (data.length > 0 && selected >= data.length) {
      setSelected(data.length - 1);
    }
  }, [data.length, selected]);

  const selectedWorktree = data[selected];

  const showDelete = selectedWorktree?.prStatus === "merged";

  const handleOpen = useCallback(async () => {
    if (!selectedWorktree) return;
    await openUrl(selectedWorktree.cursorUrl);
    setMessage(`Opened: ${selectedWorktree.name}`);
  }, [selectedWorktree]);

  const handleOpenPr = useCallback(async () => {
    if (!selectedWorktree?.prUrl) return;
    await openUrl(selectedWorktree.prUrl);
    setMessage(`Opened PR: ${selectedWorktree.name}`);
  }, [selectedWorktree]);

  const handleDelete = useCallback(async () => {
    if (!selectedWorktree) return;
    if (selectedWorktree.prStatus !== "merged") {
      setMessage(`Cannot delete: PR not merged`);
      return;
    }
    setMessage(`Removing ${selectedWorktree.name}...`);
    try {
      await removeWorktreeFull(selectedWorktree.name);
      setMessage(`Removed: ${selectedWorktree.name}`);
      await refreshLocal();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to remove: ${msg}`);
    }
  }, [selectedWorktree, refreshLocal]);

  const handlePause = useCallback(async () => {
    if (!selectedWorktree) return;
    const config = await readWorktreeConfig(selectedWorktree.name);
    config.paused = !config.paused;
    await writeWorktreeConfig(selectedWorktree.name, config);
    setMessage(`${selectedWorktree.name}: ${config.paused ? "paused" : "unpaused"}`);
    await refreshLocal();
  }, [selectedWorktree, refreshLocal]);

  const handleQa = useCallback(async () => {
    if (!selectedWorktree) return;

    try {
      const [worktreeCommit, bentoCommit] = await Promise.all([
        getWorktreeCommit(selectedWorktree.name),
        getBentoCommit(),
      ]);

      if (worktreeCommit !== bentoCommit) {
        setMessage(`Checking out in bento...`);
        await checkoutCommitInBento(worktreeCommit);
      }

      const config = await readWorktreeConfig(selectedWorktree.name);
      config.qaCommit = worktreeCommit;
      await writeWorktreeConfig(selectedWorktree.name, config);
      setMessage(`${selectedWorktree.name}: QA recorded`);
      await refreshLocal();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setMessage(`QA failed: ${msg}`);
    }
  }, [selectedWorktree, refreshLocal]);

  const handleDependency = useCallback(async () => {
    if (!selectedWorktree) return;

    // If has dependency, clear it
    if (selectedWorktree.dependsOn) {
      const config = await readWorktreeConfig(selectedWorktree.name);
      delete config.dependsOn;
      await writeWorktreeConfig(selectedWorktree.name, config);
      setMessage(`${selectedWorktree.name}: dependency removed`);
      await refreshLocal();
      return;
    }

    // Otherwise, enter selection mode
    setInputMode("selectDependency");
  }, [selectedWorktree, refreshLocal]);

  const handleDependencySelect = useCallback(async (item: { label: string; value: string }) => {
    if (!selectedWorktree) return;
    setInputMode("normal");

    const config = await readWorktreeConfig(selectedWorktree.name);
    config.dependsOn = item.value;
    await writeWorktreeConfig(selectedWorktree.name, config);
    setMessage(`${selectedWorktree.name}: now depends on ${item.value}`);
    await refreshLocal();
  }, [selectedWorktree, refreshLocal]);

  // Options for dependency selection (all worktrees except the current one)
  const dependencyOptions = data
    .filter((wt) => wt.name !== selectedWorktree?.name)
    .map((wt) => ({ label: wt.name, value: wt.name }));

  const baseOptions = Object.keys(WORKTREE_CONFIGS).map((key) => ({
    label: key,
    value: key,
  }));

  const handleBaseSelect = useCallback((item: { label: string; value: string }) => {
    setNewWorktreeBase(item.value);
    setNewWorktreeDesc("");
    setInputMode("inputDescription");
  }, []);

  const handleDescriptionSubmit = useCallback(async (value: string) => {
    const desc = value.trim().replace(/\s+/g, "-").toLowerCase();
    if (!desc) {
      setMessage("Description cannot be empty");
      setInputMode("normal");
      return;
    }

    setIsCreating(true);
    setInputMode("normal");

    try {
      const result = await createWorktree(newWorktreeBase, desc);
      setMessage(`Created: ${result.worktreeName}`);
      await refreshLocal();
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  }, [newWorktreeBase, refreshLocal]);

  const handleInputCancel = useCallback(() => {
    setInputMode("normal");
    setNewWorktreeBase("");
    setNewWorktreeDesc("");
  }, []);

  useInput((input, key) => {
    // Handle escape for canceling input or exiting
    if (key.escape) {
      if (inputMode !== "normal") {
        handleInputCancel();
      } else {
        exit();
      }
      return;
    }

    // Only handle navigation/actions in normal mode
    if (inputMode !== "normal") return;

    if (key.upArrow || input === "k") {
      setSelected((i) => Math.max(0, i - 1));
    }
    if (key.downArrow || input === "j") {
      setSelected((i) => Math.min(data.length - 1, i + 1));
    }
    if (key.return) {
      handleOpen();
    }
    if (key.tab) {
      handleOpenPr();
    }
    if (key.delete) {
      handleDelete();
    }
    if (input === "p") {
      handlePause();
    }
    if (input === "q") {
      handleQa();
    }
    if (input === "r") {
      refresh();
    }
    if (input === "n") {
      setInputMode("inputBase");
      setNewWorktreeBase("");
      setNewWorktreeDesc("");
    }
    if (input === "d") {
      handleDependency();
    }
  });

  const widths = React.useMemo(() => computeColumnWidths(data), [data]);

  // Initial loading state
  if (data.length === 0 && loading) {
    return (
      <Box>
        <Text color="cyan"><Spinner type="dots" /></Text>
        <Text> Loading worktrees...</Text>
      </Box>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <Box flexDirection="column">
        <Text>No worktrees found</Text>
      </Box>
    );
  }

  // Render input prompts or footer based on mode
  const renderFooterOrInput = () => {
    if (isCreating) {
      return (
        <Box>
          <Text color="cyan"><Spinner type="dots" /></Text>
          <Text> Creating worktree...</Text>
        </Box>
      );
    }

    if (inputMode === "inputBase") {
      return (
        <Box>
          <Text>Base: </Text>
          <SelectInput items={baseOptions} onSelect={handleBaseSelect} />
        </Box>
      );
    }

    if (inputMode === "inputDescription") {
      return (
        <Box>
          <Text>Description for {newWorktreeBase}: </Text>
          <TextInput
            value={newWorktreeDesc}
            onChange={setNewWorktreeDesc}
            onSubmit={handleDescriptionSubmit}
          />
        </Box>
      );
    }

    if (inputMode === "selectDependency") {
      return (
        <Box>
          <Text>Depends on: </Text>
          <SelectInput items={dependencyOptions} onSelect={handleDependencySelect} />
        </Box>
      );
    }

    return <Footer refreshing={loading} message={message} focused={focused} showDelete={showDelete} />;
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <TableHeader widths={widths} lastRemoteRefresh={lastRemoteRefresh} />
        {data.map((wt, i) => (
          <WorktreeRow key={wt.name} wt={wt} selected={i === selected} widths={widths} />
        ))}
      </Box>
      {renderFooterOrInput()}
    </Box>
  );
}

export async function renderTui(): Promise<void> {
  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.error("TUI mode requires an interactive terminal.");
    console.error("Run this command in a terminal that supports raw input.");
    process.exit(1);
  }
  
  const { waitUntilExit } = render(<WorktreeApp />);
  await waitUntilExit();
}
