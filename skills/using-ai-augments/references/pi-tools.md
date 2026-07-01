# pi Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your pi equivalent:

| Skill references | pi equivalent |
|-----------------|---------------|
| `Read` (file reading) | `read` |
| `Write` (file creation) | `write` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Grep` (search file content) | `bash` with `rg` / `grep` (no native grep tool) |
| `Glob` (search files by name) | `bash` with `find` / `rg --files` (no native glob tool) |
| `Skill` tool (invoke a skill) | Read the skill's `SKILL.md` file directly with `read` |
| `WebFetch` | `bash` with `curl` / `wget` |
| `WebSearch` | No native equivalent — use `bash` with a search-engine URL or a custom MCP/web tool |
| `Task` tool (dispatch subagent) | No native equivalent — see [Subagent dispatch](#subagent-dispatch) |
| `TodoWrite` (task tracking) | No native equivalent — see [Task tracking](#task-tracking) |
| `EnterPlanMode` / `ExitPlanMode` | No equivalent — pi's planning happens inline via `before_agent_start` hooks in extensions |

## Subagent dispatch

Pi does not have a built-in subagent dispatch tool. The closest equivalents:

- **Use a custom extension** that registers a tool which spawns a child `pi` process via RPC mode (`pi --mode rpc`)
- **Use `bash` with the CLI in print mode**: `pi -p "task description"` returns a single response (no tool loop)
- **Skill-defined delegation**: a skill can instruct the user to run a follow-up `pi` command in another terminal

For most pi workflows, prefer doing the work directly in the current session rather than dispatching subagents.

## Task tracking

Pi has no built-in `TodoWrite` equivalent. Track progress via:

- **Skill markdown checklists** in the working directory (`tasks.md`, `TODO.md`)
- **Extension-registered commands** that emit progress notifications via `ctx.ui.notify()`
- **`ctx.ui.setStatus(name, text)`** to display a status line for the current task
- **`ctx.ui.setWidget(name, lines)`** to display multi-line progress above the editor

## Skill loading

Pi loads skills from these locations (see [pi docs](https://pi.dev/docs/skills)):

- Global: `~/.pi/agent/skills/*/SKILL.md`
- Global flat: `~/.pi/agent/skills/*.md`
- Project: `.agents/skills/*/SKILL.md` (after trust)
- Project flat: `.agents/skills/*.md` (after trust)
- Bundled: `skills/` directories in installed pi packages

Unlike Claude Code's `Skill` tool, there is no runtime "activate" mechanism. The skill must be present on disk and is loaded as part of pi's resource discovery. Read the `SKILL.md` with the `read` tool when you need to follow a skill's instructions.

## Extension activation

Pi extensions live alongside skills and are auto-discovered from:

- `~/.pi/agent/extensions/*.ts` or `~/.pi/agent/extensions/*/index.ts`
- `.pi/extensions/*.ts` or `.pi/extensions/*/index.ts` (project-local, after trust)
- Files listed in `settings.json` under `extensions`
- Resources declared by installed pi packages

Use `/reload` inside pi to hot-reload extensions after editing. The CLI flag `--extension <path>` (or `-e`) loads an extension for a single session — useful for testing.

## Available `ctx.ui` methods for skill-defined UIs

When a skill instructs the agent to interact with the user, use these pi methods (from `ExtensionContext`):

| Skill instruction | pi equivalent |
|-------------------|---------------|
| "Ask the user to choose" | `await ctx.ui.select(title, options)` |
| "Confirm yes/no" | `await ctx.ui.confirm(title, message)` |
| "Prompt for text input" | `await ctx.ui.input(title, placeholder?)` |
| "Open editor" | `await ctx.ui.editor(title, prefill?)` |
| "Show info notification" | `ctx.ui.notify(message, "info")` |
| "Show error notification" | `ctx.ui.notify(message, "error")` |
| "Show status line" | `ctx.ui.setStatus(name, text)` |
| "Show widget above editor" | `ctx.ui.setWidget(name, lines)` |

Only TUI and RPC modes support full UI. In print mode (`-p`), dialog methods return defaults and `notify` becomes a no-op. Guard with `ctx.hasUI` before calling dialog methods.

## Bash invocation patterns

Pi's `bash` tool runs commands in the current working directory. The harness provides:

| Skill pattern | pi equivalent |
|---------------|---------------|
| `Bash(command: "...")` | `bash({ command: "..." })` |
| `Bash(description: "...")` | First argument `command` — no separate description field |
| `Bash(timeout: ...)` | `bash({ command: "...", timeout: 10000 })` (timeout in ms) |
| Long-running server | Run with `timeout` and check exit code; no async shell sessions |

Use `bash({ command: "rg ...", timeout: 30000 })` for search operations that might be slow. For file content reads, prefer the `read` tool — it streams large files and supports offsets.

## Editing patterns

Pi's `edit` tool replaces exact text. Multiple edits to the same file are applied atomically; pass them as an array:

```typescript
edit({
  path: "src/foo.ts",
  edits: [
    { oldText: "foo", newText: "bar" },
    { oldText: "baz", newText: "qux" },
  ],
})
```

When a skill says "edit file X, then re-read it to verify", call `edit` once with the new content and only re-read with `read` if you need to confirm formatting was preserved.