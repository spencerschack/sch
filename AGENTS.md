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

1. Check out the branch in `~/carrot` as a detached checkout: `git -C ~/carrot checkout <branch-name> --detach`
2. After I've tested, ask if it passed QA
3. If it passed, record it with: `npm run worktree-config <worktree-name> qa`

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

# Aliases

## acp

Add all changes, commit with a good message, and push.

```
git add -A && git commit -m "<message>" && git push
```

# Commands

## next

When the user says "next", run `npm run worktree-next` to open the most appropriate link for the first worktree needing attention.

```
npm run worktree-next
```

# Scripts

## worktree-new

Creates a new worktree based on a special `@` worktree. Handles fetching latest master, rebasing the base worktree, creating the new worktree, running setup, and opening Cursor.

```
npm run worktree-new <base> <description>
```

Example: `npm run worktree-new sage test-create-recipe-tool`

## worktree-status

Shows the status of all worktrees and their agent sessions. Outputs a table with columns for worktree name, status, and last activity time. Output the results exactly without modifications—do not strip links or other formatting. If the status shows any merged PRs, ask if I want to remove those worktrees. If the status shows any expired PRs, ask if I should pull latest master, merge master into the expired branches, and push.

```
npm run worktree-status
```

## worktree-config

Manages worktree configuration stored in `~/worktrees/.worktree-config`. Supports pausing/unpausing worktrees, tracking QA status, and cleaning up config entries. Paused worktrees show a "P" indicator in status and are not considered when running `worktree-next`.

```
npm run worktree-config <worktree-name> pause
npm run worktree-config <worktree-name> unpause
npm run worktree-config <worktree-name> remove
npm run worktree-config <worktree-name> qa
```

QA tracking:

- `qa` - Records the current commit from `~/carrot` (Bento directory) as QA'd
- Worktrees without a QA commit are implicitly skipped

The QA column in `worktree-status` shows: `-` (none/skipped), `done` (QA'd at current commit), or `stale` (new commits since QA).

## worktree-remove

Removes a worktree completely: closes Cursor windows, removes the git worktree, and cleans up the config entry.

```
npm run worktree-remove <worktree-name> [--force]
```

Use `--force` to remove worktrees with uncommitted changes.

Example: `npm run worktree-remove sage-uv-install`

## window

Manages Cursor windows. Can list, minimize, restore, focus, and close windows by pattern matching. Also detects and closes windows pointing to deleted worktree folders.

```
npm run window <command> [args]
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

- `npm run window list`
- `npm run window minimize sage-service-location`
- `npm run window close-missing`
