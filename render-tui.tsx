import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import prettyMs from "pretty-ms";
import { fetchWorktrees, openUrl } from "./worktree-status.js";
import { writeWorktreeConfig, readWorktreeConfig } from "./worktree-config.js";
import { formatAgentStatus, formatGitStatus, isBusyStatus } from "./render-table.js";
import { createWorktree, WORKTREE_CONFIGS } from "./worktree-new.js";
import { removeWorktreeFull } from "./worktree-remove.js";
import type { WorktreeInfo, PrStatus } from "./worktree-info.js";
import { execAsync } from "./utils.js";
import { homedir } from "node:os";
import { join } from "node:path";

type InputMode = "normal" | "inputBase" | "inputDescription";

const BENTO_DIR = join(homedir(), "carrot");
const REFRESH_INTERVAL = 60000; // 1 minute

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
  const needsAttention = wt.agent.status !== "active" && !isBusyStatus(wt.prStatus) && !wt.paused;
  const attention = wt.paused ? "P" : needsAttention ? "!" : " ";
  const agent = formatAgentStatus(wt.agent);
  const git = formatGitStatus(wt.git);
  const pr = wt.prStatus === "none" ? "-" : wt.prStatus;
  const qa = wt.qaStatus === "none" ? "-" : wt.qaStatus;
  return { attention, name: wt.name, agent, git, qa, pr, needsAttention };
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
    widths.name = Math.max(widths.name, row.name.length);
    widths.agent = Math.max(widths.agent, row.agent.length);
    widths.git = Math.max(widths.git, row.git.length);
    widths.qa = Math.max(widths.qa, row.qa.length);
    widths.pr = Math.max(widths.pr, row.pr.length);
  }

  return widths;
}

interface WorktreeRowProps {
  wt: WorktreeInfo;
  selected: boolean;
  widths: ColumnWidths;
}

function WorktreeRow({ wt, selected, widths }: WorktreeRowProps) {
  const row = getRowData(wt);
  const bgColor = selected ? "whiteBright" : undefined;
  const dimmed = wt.paused;

  // Pad each cell to fill its column width, plus 2 for gap
  const gap = "  ";
  const attentionPad = row.attention;
  const namePad = row.name.padEnd(widths.name);
  const agentPad = row.agent.padEnd(widths.agent);
  const gitPad = row.git.padEnd(widths.git);
  const qaPad = row.qa.padEnd(widths.qa);
  const prPad = row.pr.padEnd(widths.pr);

  return (
    <Box>
      <Text backgroundColor={bgColor} dimColor={dimmed}>
        <Text color={row.needsAttention ? "red" : dimmed ? undefined : undefined}>
          {attentionPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : "blue"} bold={selected}>
          {namePad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : getAgentColor(wt.agent.status)}>
          {agentPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : (wt.git.status === "changed" ? "yellow" : undefined)}>
          {gitPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : getQaColor(wt.qaStatus)}>
          {qaPad}
        </Text>
        {gap}
        <Text color={dimmed ? undefined : getStatusColor(wt.prStatus)}>
          {prPad}
        </Text>
      </Text>
    </Box>
  );
}

interface TableHeaderProps {
  widths: ColumnWidths;
}

function TableHeader({ widths }: TableHeaderProps) {
  const gap = "  ";
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
        {"PR".padEnd(widths.pr)}
      </Text>
    </Box>
  );
}

interface FooterProps {
  refreshing: boolean;
  lastRefresh: Date | null;
  message: string | null;
  focused: boolean;
  openAction: string;
}

function Footer({ refreshing, lastRefresh, message, focused, openAction }: FooterProps) {
  // Tick every second to update the time ago display
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const timeAgo = lastRefresh 
    ? prettyMs(Date.now() - lastRefresh.getTime(), { compact: true }) + " ago"
    : "never";
  return (
    <Box justifyContent="space-between">
      <Text dimColor>
        <Text color="cyan">P</Text>{"ause   "}
        <Text color="cyan">Q</Text>{"A   "}
        <Text color="cyan">R</Text>{"efresh   "}
        <Text color="cyan">N</Text>{"ew   "}
        <Text color="cyan">↵</Text>{` ${openAction}`}
      </Text>
      {message ? (
        <Text color="green">{message}</Text>
      ) : refreshing ? (
        <Text color="cyan">Refreshing...</Text>
      ) : !focused ? (
        <Text color="yellow">Paused (unfocused) · {timeAgo}</Text>
      ) : (
        <Text dimColor>Updated {timeAgo}</Text>
      )}
    </Box>
  );
}

function useWorktreeData(paused: boolean) {
  const [data, setData] = useState<WorktreeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const worktrees = await fetchWorktrees();
      setData(worktrees);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic refresh when not paused
  useEffect(() => {
    if (paused) return;
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh, paused]);

  // Refresh when becoming unpaused (regaining focus)
  const prevPaused = React.useRef(paused);
  useEffect(() => {
    if (!paused && prevPaused.current) {
      refresh();
    }
    prevPaused.current = paused;
  }, [paused, refresh]);

  return { data, loading, lastRefresh, refresh };
}

function WorktreeApp() {
  const { exit } = useApp();
  const focused = useFocused();
  const { data, loading, lastRefresh, refresh } = useWorktreeData(!focused);
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

  const openAction = selectedWorktree?.prStatus === "merged"
    ? "Remove"
    : selectedWorktree?.prUrl
      ? "Open PR"
      : "Open Cursor";

  const handleOpen = useCallback(async () => {
    if (!selectedWorktree) return;
    
    if (selectedWorktree.prStatus === "merged") {
      setMessage(`Removing ${selectedWorktree.name}...`);
      try {
        await removeWorktreeFull(selectedWorktree.name);
        setMessage(`Removed: ${selectedWorktree.name}`);
        await refresh();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setMessage(`Failed to remove: ${msg}`);
      }
      return;
    }
    
    const url = selectedWorktree.prUrl ?? selectedWorktree.cursorUrl;
    await openUrl(url);
    setMessage(`Opened: ${selectedWorktree.name}`);
  }, [selectedWorktree, refresh]);

  const handlePause = useCallback(async () => {
    if (!selectedWorktree) return;
    const config = await readWorktreeConfig(selectedWorktree.name);
    config.paused = !config.paused;
    await writeWorktreeConfig(selectedWorktree.name, config);
    setMessage(`${selectedWorktree.name}: ${config.paused ? "paused" : "unpaused"}`);
    await refresh();
  }, [selectedWorktree, refresh]);

  const handleQa = useCallback(async () => {
    if (!selectedWorktree) return;
    const config = await readWorktreeConfig(selectedWorktree.name);
    config.qaCommit = await getBentoCommit();
    await writeWorktreeConfig(selectedWorktree.name, config);
    setMessage(`${selectedWorktree.name}: QA recorded`);
    await refresh();
  }, [selectedWorktree, refresh]);

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
      await refresh();
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  }, [newWorktreeBase, refresh]);

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

    return <Footer refreshing={loading} lastRefresh={lastRefresh} message={message} focused={focused} openAction={openAction} />;
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <TableHeader widths={widths} />
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
