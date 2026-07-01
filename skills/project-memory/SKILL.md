---
name: project-memory
description: Use when recording bugs, architectural decisions, project configuration facts, or completed work. Maintains docs/project-notes/ with structured, dated entries that prevent repeated troubleshooting and preserve architectural rationale across sessions and team members.
---

# Project Memory

## Overview

Maintain institutional knowledge by recording bugs, architectural decisions, configuration facts, and work history in `docs/project-notes/`. Prevents repeated troubleshooting, preserves "why" context, and provides searchable records across sessions.

## Skill Activation Notice (Required)

Before updating project memory, announce:

```markdown
Skill Activated
- Skill: project-memory
- Why: durable project knowledge should be checked or recorded now
- What: read or update the appropriate memory file with concise, dated entries
- How: follow the memory workflow; confirm with user before writing updates unless strict feature/bugfix workflow policy mandates automatic write
```

**Four files, one discipline:**
- **bugs.md** — Resolved defects with root cause and prevention
- **decisions.md** — Architectural trade-offs (ADR style)
- **key_facts.md** — Non-sensitive config, ports, URLs (see references/key_facts_template.md for security guidelines)
- **issues.md** — Work log with ticket IDs and dates

## First skill run

If `docs/project-notes/` is missing OR any of the four starter files is missing OR `AGENTS.md`/`CLAUDE.md` is missing one of the four required markers, run the initializer:

```bash
./scripts/init_project_memory.sh [path/to/repo]
```

Then read the printed summary and report to the user:

- Files and directories that were created
- Agent config files that were patched and which markers were missing
- Any action items left for the user (e.g., create `AGENTS.md` themselves)

If everything is already in place, the script exits with a "no changes needed" summary — do not re-run initialization in that case; proceed directly to the user's actual request.

## When to Use

✅ **Use when:**
- Recording a resolved bug with reproducible root cause
- Documenting an architectural or build-system decision
- Capturing configuration facts before they're forgotten
- Completing high-value changes (3+ files, new targets, new subsystems)
- Encountering a problem that feels familiar

✅ **Also use when:**
- Before proposing architectural changes (check decisions.md first)
- Before assuming port numbers, build flags, or configuration (check key_facts.md)
- After stable feature completion (check Task Completion Protocol below)

## Quick Reference: File Purposes and Entry Formats

| File | When to Use | Entry Format |
|------|------------|--------------|
| **bugs.md** | After fixing a reproducible defect with root cause | `### YYYY-MM-DD - Title` + Issue/Repro/Root Cause/Solution/Prevention |
| **decisions.md** | After making an architectural or build-system choice | `### ADR-XXX: Title (YYYY-MM-DD)` + Context/Decision/Alternatives/Consequences |
| **key_facts.md** | When documenting non-sensitive config (ports, URLs, version rules) | Organized by section with bullets, dates, and source URLs |
| **issues.md** | After completing a ticket marked as high-value work | `### YYYY-MM-DD - TICKET-ID: Title` + Status/Description/URL/Notes |

**All entries must have dates. All decisions need ADR numbers. No credentials or secrets — use env vars or secret manager.**

## Decision: Should I Update Memory NOW?

```
Do I have a new bug to document?
    ↓ YES
Does the fix have a reproducible root cause + prevention value?
    ↓ YES → Add to bugs.md
    ↓ NO  → Skip

Did I just make an architectural/build decision?
    ↓ YES → Add to decisions.md (ADR format)

Am I completing a ticket and changes span 3+ files?
    ↓ YES → Consider issues.md entry
    
Am I documenting config/constraints for future devs?
    ↓ YES → Add to key_facts.md
```

## Red Flags: When You're Rationalizing (Stop Here!)

❌ **"I'll document this after I merge"** — NO. You won't. Update memory NOW while context is fresh.

❌ **"This isn't stable enough to document"** — FALSE. Configuration facts, bug solutions, and decisions ARE stable. Write them down.

❌ **"Just a refactor, no need to update memory"** — WRONG. Refactors ARE decisions if they involved trade-offs. Document the choice.

❌ **"I'll check memory files later if I need them"** — BACKWARD. Check FIRST before proposing changes. Avoid reinventing rejected approaches.

❌ **"This bug fix is too small to log"** — IF it has a root cause + prevention value, log it. Small fixes with big insights are the most valuable.

**THE IRON RULE:** If you found it worth fixing, it's worth remembering. Update memory at completion, not later.

## Table of Contents Synchronization (Mandatory)

When you edit any markdown file under `docs/project-notes/`, update that file's Table of Contents in the same change.

Requirements:
- Add ToC entries for new sections.
- Remove or rename ToC entries when section titles change.
- Keep anchor links aligned with the current heading text.

This applies to `bugs.md`, `decisions.md`, `key_facts.md`, `issues.md`, and any nested note/plans documents that include a ToC block.

## How: Entry Templates

**Bug Entry:**
```markdown
### YYYY-MM-DD - Brief Title
- **Issue**: What went wrong
- **Reproduction**: Steps to reliably reproduce
- **Root Cause**: Why it happened
- **Solution**: How it was fixed
- **Prevention**: How to avoid in the future
```

**Decision Entry:**
```markdown
### ADR-001: Brief Title (YYYY-MM-DD)

**Context:** Why the decision was needed

**Decision:** What was chosen

**Alternatives:** Option A (rejected because...), Option B (rejected because...)

**Consequences:** ✅ Benefits, ❌ Trade-offs
```

**Fact Entry:** Organize by category (Dev Environment, Build Presets, Ports, etc.), use bullets with dates and URLs.

**Work Log Entry:**
```markdown
### YYYY-MM-DD - TICKET-123: Brief Title
- **Status**: Completed
- **URL**: https://tracker.example.com/TICKET-123
- **Notes**: Brief context on why it was high-value work
```

## Task Completion Protocol: Update Memory for High-Value Work

## Workflow Override: Strict Feature/Bugfix Mode

When a higher-priority workflow policy explicitly mandates memory updates for feature implementation or bug fixes, this skill must write project-memory entries without a user confirmation prompt.

Scope of override:
- Applies only to feature implementation and bug-fix intents in strict workflow mode.
- Does not apply to PoC, exploratory, or non-implementation requests.

**High-value change indicator checklist** — If ANY of these are true, update memory:
- ✅ Changes across 3+ files
- ✅ New build target or CMake preset added
- ✅ New module/subsystem implemented
- ✅ Architectural or build-system decision made
- ✅ Configuration facts or constraints needed by future developers
- ✅ Process/workflow changes affecting contributors

**Completion flow:**
1. Feature builds and tests pass
2. Ask: "Do any high-value indicators apply?" 
3. YES → If strict feature/bugfix workflow override is active, update appropriate file(s) directly.
4. When writing to markdown memory files, synchronize each file's ToC before finishing edits.
5. Otherwise, suggest: "This looks like a candidate for memory. Want me to add it?"
6. If confirmed, update appropriate file(s)
7. Update the code graph by calling `python3 tools/scripts/generate_code_graph.py` from the project root
8. Mark task complete

**Why this matters:** Future developers inherit understanding of WHY choices were made and HOW problems were solved, reducing re-solving the same issues.

## Setup: One-Time Initialization

Initialization is **idempotent and automated** via a single shell script. Run it once per repository; re-running it is a safe no-op.

```bash
./scripts/init_project_memory.sh            # run from the skill folder
./scripts/init_project_memory.sh /path/to/repo   # or target a specific repo
```

The script does this, in order:

1. **Ensure `docs/project-notes/` exists.** Creates it if missing.
2. **Ensure the four starter files exist** (`bugs.md`, `decisions.md`, `key_facts.md`, `issues.md`). Each starter is minimal: title, one-line purpose, blank `## Entries` section. Templates live in `references/` and are **not** copied into the working files.
3. **Detect `AGENTS.md` at the project root.** If absent, the patch step is skipped (the script will not create the file).
4. **Verify the four required markers** in `AGENTS.md`:
   - `## Project Memory System`
   - `After high-value codebase changes:`
   - `## Task Completion Protocol`
   - `High-value change indicators (ANY met = should document):`
5. **If any marker is missing, append the full section** from `references/AGENTS-memory-section.md`, preserving the exact order documented in that reference file. The pre-existing content of `AGENTS.md` is preserved verbatim — only the missing section is appended.
6. **Repeat steps 3–5 for `CLAUDE.md`** (multi-tool setups), using `references/CLAUDE-memory-section.md`.
7. **Print a summary** of what was created and patched, so the calling agent can report it back to the user.

### Detection Order

When a project has both `AGENTS.md` and `CLAUDE.md`, the script patches them in this priority order:

1. `AGENTS.md` (primary entrypoint, checked first)
2. `CLAUDE.md` (multi-tool support)

This matches the reference files' documented intent (`references/AGENTS-memory-section.md` is the source of truth; `references/CLAUDE-memory-section.md` is the optional mirror).

### When the User Has Neither AGENTS.md Nor CLAUDE.md

The script will still create `docs/project-notes/` and the four starter files, but **it will not create `AGENTS.md` or `CLAUDE.md`** — adding such a file is a project-policy decision and must be done by the user. In that case, the calling agent should:

- Report that the notes directory was initialized
- Recommend that the user create `AGENTS.md` (or run the script after they do)

### Manual Setup Fallback

If the script cannot be executed (e.g., sandboxed environment), perform the same steps manually:

1. `mkdir -p docs/project-notes/`
2. Create each of the four starter files with a title + one-line purpose + `## Entries` section.
3. Read `references/AGENTS-memory-section.md` and append its full content to `AGENTS.md` (only if `AGENTS.md` does not already contain all four markers).
4. Optionally do the same for `CLAUDE.md` using `references/CLAUDE-memory-section.md`.

## Proactive Reminders

After detecting high-value changes, suggest memory updates without waiting for user request:
- **Example:** "This looks like a candidate for decisions.md (new build preset). Want me to add it?"
- **Keep brief:** One-line suggestion, get confirmation before writing
- **Don't auto-write:** Always confirm with user before updating files

## Search and Lookup

```bash
# Find similar bugs
grep -i "connection refused" docs/project-notes/bugs.md

# Find decisions about a technology  
grep -i "cmake" docs/project-notes/decisions.md

# Look up config facts
grep -A 3 "Build Presets" docs/project-notes/key_facts.md
```

## Common Mistakes

❌ **Storing passwords or API keys in key_facts.md** — Use env vars or secret manager instead.

❌ **Writing prose narratives instead of bullet lists** — Keep entries concise (1-3 lines).

❌ **Updating memory weeks later** — Do it at task completion while context is fresh.

❌ **Over-documenting low-value changes** — Focus on bugs with root cause insight, decisions with trade-offs, configuration that affects future builds.

✅ **Updating immediately after completing work** — Yes, this is the right time.

✅ **Checking memory before proposing major changes** — Yes, saves rework.

✅ **Using dated entries and linking to tickets** — Yes, provides traceability.

## References

Full template examples and AGENTS.md/CLAUDE.md configuration sections are in the `references/` folder:
- `bugs_template.md` — Extended bug log example
- `decisions_template.md` — Extended ADR examples
- `key_facts_template.md` — Fact organization and security guidelines  
- `issues_template.md` — Work log examples
- `AGENTS-memory-section.md` — Full AGENTS.md "Project Memory System" section to copy/paste
- `CLAUDE-memory-section.md` — Optional multi-tool configuration