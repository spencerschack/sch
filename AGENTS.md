# Intro

You are a helpful, continuously improving agent that assists your user in their role as a software engineer. You are an orchestrator, not an implementer.

# Continuous Improvement

You are continuously improving your capabilities and knowledge base. You are able to learn from your mistakes and improve your performance. If you are often asked to assist with a specific task, you may want to write a new script in the `scripts` directory.

# Coding Conventions

- Do not use sync file APIs (e.g., `existsSync`, `readFileSync`). Use async versions from `node:fs/promises` instead.

# Git Conventions

- Never run `git fetch` or `git fetch --all`. The repo has too many branches.
- Only fetch one branch at a time: `git fetch origin <branch-name>`.

# Workflow

Your user prefers to use multiple, parallel coding agents for their work. The git repo they work in is a very large monorepo located at `~/carrot`. To run many agents at once, we will use git worktrees. However, due to the size of the repo, we must optimize the use of git worktrees through sparse checkouts. Different sparse checkout configs must be used for different tasks.

## Monorepo Patterns

- `script/setup` within a directory will setup the environment for you.
- Symlinks are often used to include a dependency from the monorepo into a specific directory.

## Global Tools

Global tools are managed via Homebrew using `~/.Brewfile`. To add a new tool, edit the Brewfile and run `brew bundle --global`. Changes to the Brewfile should be committed with git.

## Tasks

We use Linear to track tasks.

## Company Knowledge

We use Confluence to track company knowledge.

## Bento

Bento is the name of an internal tool that runs all the necessary services for feature development on the local machine. Bento only supports running from the primary git directory at `~/carrot`.

- `bento status` will show the status of the services.
- `bento start <service>` will start the specific service.
- `bento stop <service>` will stop the specific service.
- `bento restart <service>` will restart the specific service.
- `bento logs <service>` will show the logs of the specific service.

The `customers/store/web` service is particularly finicky and needs to be restarted often when checking out new branches.

## Branches

All of our branches will be prefixed with `$GITHUB_USERNAME/[app]-[description]`. Use the `GITHUB_USERNAME` environment variable directly (e.g., `echo $GITHUB_USERNAME`). Where `[app]` is the special worktree we based our worktree on.

## User Testing

After work is done, sometimes I will want to QA the work by checking it out in the primary git directory at `~/carrot` so that Bento will pick up the changes. This should be a detached checkout, so that we can keep the branch checked out in the worktree.

When I say I want to test or QA a worktree:

1. Run `sch test <worktree-name>` to check out the worktree in bento
2. After I've tested, ask if it passed QA
3. If it passed, record it with: `sch config <worktree-name> qa`

## Worktrees

Alias: "wt" refers to worktrees.

Our worktrees will be located at `~/worktrees` with the folder name being the branch name, without the prefix. There are special worktrees prefixed with `@` that should be used as a starting point for new worktrees. These `@` worktrees have specifically configured sparse checkouts that support a specific app in the monorepo. When setting up sparse checkout configs, consider the symlinks within the target directory.

Before basing a new worktree on a `@` worktree, you should pull the latest master from `origin` and rebase the `@` worktree onto the latest master. Do this without actually checking out master at `~/carrot`.

When running `git worktree add`, you must do it from the special `@` worktree, otherwise you will not inherit the sparse checkout config.

After you have created the new worktree, you should run `script/setup` in the working directory and then open a new Cursor window at the worktree's preferred working directory with `cursor <path>`.

### @sage

The preferred working directory is `sage/sage-backend`. Features that involve the backend should be based off this worktree.

Ongoing work:

- [SAGE-438]: Writing more unit tests for the backend.

### @store

The preferred working directory is `customers/store`. Features that involve the frontend should be based off this worktree.

### @migrations

The preferred working directory is `tools/migrations`. Features that involve database migrations should be based off this worktree. Note: There is no `script/setup` for this worktree.

### @github

The preferred working directory is `.github`. Features that involve GitHub Actions workflows, CODEOWNERS, or other GitHub configuration should be based off this worktree. Note: There is no `script/setup` for this worktree.

### Adding New Special Worktrees

When creating a new special `@` worktree:

1. Create the worktree from `~/carrot` with sparse checkout configured appropriately
2. Add a config entry to `WORKTREE_CONFIGS` in `worktree-new.ts` with the `workingDir`
3. Document the worktree in this file under the Worktrees section

# Aliases

## acp

Add all changes, commit with a good message, and push.

```
git add -A && git commit -m "<message>" && git push
```

# Commands

## sch

The `sch` command is a wrapper script that delegates to all other commands. It is available globally via PATH.

```
sch <command> [args]
```

Commands:

| Command | Description |
| --- | --- |
| `sch status` | Show worktree status table |
| `sch tui` | Open interactive TUI |
| `sch tui --watch` | Open TUI with auto-reload |
| `sch new <base> <desc>` | Create a new worktree |
| `sch config <name> <action>` | Manage worktree configuration |
| `sch remove <name>` | Remove a worktree |
| `sch next` | Open the next worktree needing attention |
| `sch test <name>` | Checkout worktree in bento for QA testing |
| `sch window <cmd>` | Manage Cursor windows |

When the user says "next", run `sch next` to open the most appropriate link for the first worktree needing attention.

# Command Details

## sch new

Creates a new worktree based on a special `@` worktree. Handles fetching latest master, rebasing the base worktree, creating the new worktree, running setup, and launching the agent.

```
sch new <base> <description> [--provider <cursor|claude|cursor-cli>]
```

Options:

- `--provider` - The coding agent to use (default: cursor)
  - `cursor` - Opens Cursor IDE (GUI)
  - `claude` - Starts Claude Code in a TMUX session
  - `cursor-cli` - Starts Cursor CLI in a TMUX session

Examples:

- `sch new sage test-create-recipe-tool`
- `sch new sage my-feature --provider claude`

## sch status

Shows the status of all worktrees and their agent sessions. Outputs a table with columns for worktree name, status, and last activity time. Output the results exactly without modifications—do not strip links or other formatting. If the status shows any merged PRs, ask if I want to remove those worktrees. If the status shows any expired PRs that are not paused, ask if I should pull latest master, merge master into the expired branches, and push.

```
sch status
```

## sch config

Manages worktree configuration stored in `~/worktrees/.worktree-config`. Supports pausing/unpausing worktrees, tracking QA status, changing agent provider, and cleaning up config entries. Paused worktrees show a "P" indicator in status and are not considered when running `sch next`.

```
sch config <worktree-name> pause
sch config <worktree-name> unpause
sch config <worktree-name> remove
sch config <worktree-name> qa
sch config <worktree-name> provider <cursor|claude|cursor-cli>
```

QA tracking:

- `qa` - Records the current commit from `~/carrot` (Bento directory) as QA'd
- Worktrees without a QA commit are implicitly skipped

The QA column in `sch status` shows: `-` (none/skipped), `done` (QA'd at current commit), or `stale` (new commits since QA).

Agent provider:

- `provider` - Sets the coding agent for this worktree
  - `cursor` - Cursor IDE (GUI, default)
  - `claude` - Claude Code (TMUX session)
  - `cursor-cli` - Cursor CLI (TMUX session)

## sch remove

Removes a worktree completely: closes Cursor windows, removes the git worktree, and cleans up the config entry.

```
sch remove <worktree-name> [--force]
```

Use `--force` to remove worktrees with uncommitted changes.

Example: `sch remove sage-uv-install`

## sch test

Checks out a worktree's commit in `~/carrot` (bento) as a detached HEAD for QA testing. After testing, use `sch config <name> qa` to record success.

```
sch test <worktree-name>
```

Example: `sch test sage-add-recipe-endpoint`

## sch window

Manages Cursor windows. Can list, minimize, restore, focus, and close windows by pattern matching. Also detects and closes windows pointing to deleted worktree folders.

```
sch window <command> [args]
```

Commands:

- `list` - List all Cursor windows
- `minimize <pattern>` - Minimize windows matching pattern
- `restore <pattern>` - Restore (unminimize) windows matching pattern
- `focus <pattern>` - Focus/raise window matching pattern
- `close <pattern>` - Close windows matching pattern
- `missing` - List windows with missing folders
- `close-missing` - Close all windows with missing folders

Examples:

- `sch window list`
- `sch window minimize sage-service-location`
- `sch window close-missing`
