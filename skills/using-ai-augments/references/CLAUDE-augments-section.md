# CLAUDE.md: AI Augments Skills Section (mirror)

This file is a multi-tool mirror of `AGENTS-augments-section.md`. Use the same content if your project keeps both `AGENTS.md` and `CLAUDE.md` (some teams prefer the Claude-specific name for legacy reasons).

If both files exist, keep them in sync. Treat `AGENTS.md` as the source of truth.

---

## AI Augments Skills

This project follows a skill-driven workflow. AI tools working in this repository MUST consult the `using-ai-augments` skill before any response, action, or clarifying question.

### Why this matters

The `using-ai-augments` skill is the routing layer for all other skills in this project. It tells the agent:

- How to discover available skills (skill directories, SKILL.md frontmatter, registry)
- Which skill takes priority when multiple apply (process skills first, then implementation)
- When to invoke a skill (before any action — even clarifying questions)
- How to handle the red-flag rationalizations ("just a quick question", "let me explore first", etc.)

Without this skill activated, an agent will fall back to ad-hoc behavior and skip skill discipline. That breaks the rest of the workflow.

### Required behavior

When this section is present in `CLAUDE.md`, the agent MUST, at the start of every user request:

1. **Read** `using-ai-augments/SKILL.md` from the skills directory (or load via the platform's `Skill` tool).
2. **Follow** the "How to Access Skills" and "Red Flags" sections verbatim.
3. **Run** the flow chart: scan registry → prioritize → activate → execute workflows.
4. **Announce** skill activation with the standard notice (see SKILL.md → "Skill Activation Notice").

### Skill discovery locations

This project uses the following skill layout:

| Resource | Location | Notes |
|----------|----------|-------|
| Project skills | `skills/*/SKILL.md` | Bundled with the repo |
| Global skills | `~/.pi/agent/skills/` or platform equivalent | Per-user additions |
| References | `skills/*/references/*.md` | Linked from SKILL.md when needed |
| Scripts | `skills/*/scripts/*.sh` | Idempotent initializers (e.g. `init_project_memory.sh`) |

### Platform-specific notes

For tool-name mapping between platforms (Claude Code, Codex, Copilot CLI, Gemini CLI, pi), see the references folder of the `using-ai-augments` skill itself. If your agent runs in pi, read `skills/using-ai-augments/references/pi-tools.md`.

### Related workflows

- **Project Memory**: After completing high-value work, the agent should consult `using-project-memory` (or this repo's `skills/project-memory` if vendored) to decide whether to log a bug, decision, fact, or issue.
- **V-Model / TDD enforcement**: If a `docs/project-notes/plans/` file is present and active, the agent follows `using-v-model` discipline.

### User instructions still win

This section enforces skill discipline, but explicit user instructions in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or in the current conversation always take precedence. If the user says "skip skills for this one task," comply.

---

## Verification Checklist

After adding this section to `CLAUDE.md`, verify it contains both required markers:
- `## AI Augments Skills` ✓
- `skill-driven workflow` ✓

If any marker is missing, initialization is incomplete.