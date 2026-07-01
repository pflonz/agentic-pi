# Project Memory Skill

This document explains the purpose of the project-memory skill and how to use it in day-to-day development.

## Purpose

The project-memory skill helps teams preserve technical context over time by maintaining structured notes in:

- docs/project-notes/bugs.md
- docs/project-notes/decisions.md
- docs/project-notes/key_facts.md
- docs/project-notes/issues.md

It reduces repeated troubleshooting, preserves architectural rationale, and supports consistent collaboration across developers and AI tools.

## When to Use It

Use the skill when you want to:

- Initialize project memory for a repository
- Log a resolved bug and its root cause
- Record or update architectural decisions (ADR style)
- Capture non-sensitive build/environment facts
- Track completed work with ticket references

## How to Use It

1. Read the skill definition in SKILL.md.
2. Initialize via the bundled script (idempotent — safe to re-run):
   ```bash
   ./scripts/init_project_memory.sh            # current directory
   ./scripts/init_project_memory.sh /path/to/repo   # specific repo
   ```
3. The script creates `docs/project-notes/` with four minimal starter files (title + purpose + blank `## Entries` section). Templates in `references/` are guidance only — they are **not** copied into the working files.
4. The script detects `AGENTS.md` (primary entrypoint) and `CLAUDE.md` (optional multi-tool) and verifies the four required markers. If any marker is missing, the full section is appended from the corresponding `references/<AGENTS|CLAUDE>-memory-section.md`, preserving that file's documented order.
5. Detection order: `AGENTS.md` first, `CLAUDE.md` second.
6. If neither agent config exists, the script still creates the notes directory but leaves the config-file decision to the user.
7. Update memory files continuously during normal engineering work.

## File Roles

- bugs.md: Reproducible bug history and fixes
- decisions.md: Why key technical decisions were made
- key_facts.md: Quick lookup, non-sensitive configuration facts
- issues.md: Short work log linked to ticket system

## Initialization Policy

- Create minimal starter files only; do not copy full template content.
- Keep templates in references/ as guidance, not as content to copy.
- Add entries only when real bugs, decisions, facts, or ticket work occur.

## Maintenance Rules

- Keep entries concise and dated
- Prefer bullet-list updates over large prose blocks
- Add source links (ticket URLs, docs, relevant files)
- Never store passwords, tokens, private keys, or secrets
- Clean up stale entries periodically

## References

- Skill workflow: SKILL.md
- Initializer script: scripts/init_project_memory.sh
- Templates: references/bugs_template.md, references/decisions_template.md, references/key_facts_template.md, references/issues_template.md
- Agent-config sections: references/AGENTS-memory-section.md, references/CLAUDE-memory-section.md
