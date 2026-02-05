# Claude Code Session Persistence Report

**Version:** 2.1.31  
**Install Location:** `~/.config/gohan/bin/claude`

## Directory Structure

```
~/.claude/
├── cache/                    # Cached data (changelog.md - 85KB)
├── debug/                    # Debug logs per session
│   ├── {session-uuid}.txt   # Session debug log
│   └── latest -> ...        # Symlink to most recent
├── history.jsonl            # Command history
├── plugins/                  # Plugin system
│   ├── cache/               # Downloaded plugin files
│   ├── install-counts-cache.json
│   ├── installed_plugins.json
│   ├── known_marketplaces.json
│   └── marketplaces/        # Cloned marketplace repos
├── projects/                 # Per-project session data
│   └── {encoded-path}/
│       └── {session-uuid}.jsonl  # Conversation transcript
├── settings.json            # User settings (env vars, plugins)
├── shell-snapshots/         # Shell state snapshots (~178KB each)
├── statsig/                 # Feature flags/experiments
└── todos/                   # Task lists per session
    └── {session-uuid}-agent-{uuid}.json

~/.claude.json               # Global state file (projects, stats, user ID)
```

## Key Files

| File                                      | Purpose                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `~/.claude.json`                          | Global config: per-project stats (cost, tokens, duration), allowed tools, MCP servers, user ID, theme, tip history |
| `~/.claude/settings.json`                 | Environment variables, extra marketplaces, enabled plugins                                                         |
| `~/.claude/history.jsonl`                 | Command input history with timestamps, project paths, session IDs                                                  |
| `~/.claude/projects/{path}/{uuid}.jsonl`  | **Session transcripts** - full conversation with tool calls and metadata                                           |
| `~/.claude/todos/{uuid}.json`             | Persisted task lists from sessions                                                                                 |
| `~/.claude/debug/{uuid}.txt`              | Detailed debug logs (MCP, plugins, LSP, render timing)                                                             |
| `~/.claude/shell-snapshots/snapshot-*.sh` | Full shell environment dumps (functions, aliases)                                                                  |

## Session Transcript Format

Each line in `projects/{path}/{uuid}.jsonl` is a JSON object:

```json
{
  "type": "user" | "file-history-snapshot",
  "uuid": "message-uuid",
  "parentUuid": "previous-message-uuid",
  "sessionId": "session-uuid",
  "version": "2.1.31",
  "cwd": "/path/to/project",
  "gitBranch": "master",
  "message": { "role": "user", "content": "..." },
  "timestamp": "2026-02-04T19:41:22.290Z",
  "isMeta": false,
  "isSidechain": false
}
```

## Project Stats in ~/.claude.json

Per-project tracking includes:

- `lastCost` - Session cost in USD
- `lastTotalInputTokens`, `lastTotalOutputTokens`
- `lastTotalCacheCreationInputTokens`, `lastTotalCacheReadInputTokens`
- `lastDuration`, `lastAPIDuration`, `lastToolDuration`
- `lastLinesAdded`, `lastLinesRemoved`
- `lastSessionId` - Links to the `.jsonl` transcript
- `lastModelUsage` - Breakdown by model (e.g., `us.anthropic.claude-haiku-4-5-20251001-v1:0`)
- `exampleFiles` - Discovered file patterns for project
- `hasTrustDialogAccepted`, `allowedTools`, `mcpServers`

## Todo Persistence

Stored as JSON arrays in `~/.claude/todos/{session-uuid}-agent-{uuid}.json`:

```json
[
  {
    "id": "1",
    "content": "Task description",
    "status": "completed",
    "priority": "high"
  },
  {
    "id": "2",
    "content": "Another task",
    "status": "in_progress",
    "priority": "medium"
  }
]
```

## History File Format

Each line in `~/.claude/history.jsonl`:

```json
{
  "display": "/plugin ",
  "pastedContents": {},
  "timestamp": 1770233618464,
  "project": "/Users/spencerschack/sch",
  "sessionId": "9007da16-db80-4cc1-aa87-3224f3420e88"
}
```

## Settings File

`~/.claude/settings.json` contains:

```json
{
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "ANTHROPIC_BEDROCK_BASE_URL": "https://..."
  },
  "extraKnownMarketplaces": {
    "instacart": {
      "source": {"source": "github", "repo": "instacart/claude-marketplace"}
    }
  },
  "enabledPlugins": {
    "annual-reviews@instacart": true
  }
}
```

## Plugin System

### Installed Plugins (`installed_plugins.json`)

```json
{
  "version": 2,
  "plugins": {
    "annual-reviews@instacart": [
      {
        "scope": "user",
        "installPath": "~/.claude/plugins/cache/instacart/annual-reviews/77c9352cf8f1",
        "version": "77c9352cf8f1",
        "installedAt": "2026-02-04T19:33:31.720Z",
        "gitCommitSha": "77c9352cf8f152366bacb223f2f7b3a55e9a98ce"
      }
    ]
  }
}
```

### Known Marketplaces (`known_marketplaces.json`)

```json
{
  "instacart": {
    "source": {"source": "github", "repo": "instacart/claude-marketplace"},
    "installLocation": "~/.claude/plugins/marketplaces/instacart",
    "lastUpdated": "2026-02-04T19:33:31.671Z"
  },
  "claude-plugins-official": {
    "source": {
      "source": "github",
      "repo": "anthropics/claude-plugins-official"
    },
    "installLocation": "~/.claude/plugins/marketplaces/claude-plugins-official"
  }
}
```

## Debug Logs

`~/.claude/debug/{session-uuid}.txt` contains timestamped debug entries:

```
2026-02-04T19:33:28.159Z [DEBUG] [init] configureGlobalMTLS starting
2026-02-04T19:33:28.165Z [DEBUG] [STARTUP] Running setup()...
2026-02-04T19:33:28.184Z [DEBUG] [STARTUP] setup() completed in 19ms
2026-02-04T19:33:28.237Z [DEBUG] [LSP MANAGER] initializeLspServerManager() called
2026-02-04T19:33:28.239Z [DEBUG] MCP server "glean_default": Initializing HTTP transport
```

## Shell Snapshots

`~/.claude/shell-snapshots/snapshot-zsh-*.sh` captures the full shell environment:

- All shell functions
- Aliases (unset to avoid conflicts)
- Used for shell integration features

## Statsig (Feature Flags)

```
~/.claude/statsig/
├── statsig.cached.evaluations.{hash}  # Cached feature flag evaluations
├── statsig.last_modified_time.evaluations
├── statsig.session_id.{hash}
└── statsig.stable_id.{hash}
```

## Notable Observations

1. **Session IDs are UUIDs** - One `.jsonl` per session, stored under project path (with `-` replacing `/`)
2. **File history snapshots** are embedded in the transcript for undo support
3. **Shell snapshots** capture full zsh environment (~178KB) for shell integration
4. **Debug logs** include timing data (render FPS, API duration) and MCP server initialization
5. **Statsig** handles feature flags with cached evaluations
6. **Plugins** are installed from GitHub marketplaces with git commit SHAs for versioning
7. **Project paths are encoded** by replacing `/` with `-` (e.g., `/Users/spencerschack/sch` → `-Users-spencerschack-sch`)
