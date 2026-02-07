---
name: sch-worktree-manager
description: Manage git worktrees for parallel agent development. Use when the user mentions worktrees, asks to create/remove worktrees, check worktree status, or says "next" to open the next worktree needing attention.
---

# SCH Worktree Manager

The `sch` command manages git worktrees for running multiple parallel coding agents on a large monorepo.

## Commands

| Command | Description |
|---------|-------------|
| `sch status` | Show worktree status table |
| `sch new <base> <desc>` | Create a new worktree |
| `sch remove <name>` | Remove a worktree |
| `sch next` | Open the next worktree needing attention |
| `sch config <name> <action>` | Manage worktree configuration |
| `sch test <name>` | Checkout worktree in bento for QA testing |
| `sch tui` | Open interactive TUI |
| `sch window <cmd>` | Manage Cursor windows |

## Creating Worktrees

```bash
sch new <base> <description> [--provider <cursor|claude|cursor-cli>]
```

Base worktrees (prefixed with `@`) have pre-configured sparse checkouts:

| Base | Working Directory | Use For |
|------|-------------------|---------|
| `@sage-backend` | `sage/sage-backend` | Backend-only features |
| `@sage-fullstack` | `.` (root) | Full stack (backend + frontend) |
| `@store` | `customers/store` | Frontend features |
| `@migrations` | `tools/migrations` | Database migrations |
| `@github` | `.github` | GitHub Actions/config |

Example: `sch new sage-backend add-recipe-endpoint`

## Checking Status

```bash
sch status
```

Output the results exactly without modifications. If status shows:
- **Merged PRs**: Ask if user wants to remove those worktrees
- **Expired PRs not paused**: Ask if you should pull latest master, merge into expired branches, and push

## Removing Worktrees

```bash
sch remove <worktree-name> [--force]
```

Use `--force` for worktrees with uncommitted changes.

## Configuration

```bash
sch config <worktree-name> <action>
```

Actions:
- `pause` / `unpause` - Paused worktrees show "P" and are skipped by `sch next`
- `qa` - Record current commit from `~/carrot` as QA'd
- `provider <cursor|claude|cursor-cli>` - Set the coding agent
- `remove` - Clean up config entry

## Opening Next Worktree

When user says "next":

```bash
sch next
```

Opens the most appropriate link for the first worktree needing attention.

## Window Management

```bash
sch window <command> [args]
```

Commands: `list`, `minimize <pattern>`, `restore <pattern>`, `focus <pattern>`, `close <pattern>`, `missing`, `close-missing`

## User Testing Workflow

When user wants to test/QA a worktree:

```bash
sch test <worktree-name>
```

This checks out the worktree's commit in `~/carrot` (bento) as a detached HEAD. After testing:

```bash
sch config <worktree-name> qa
```
