# CLAUDE.md: Project Memory System Section (Optional Multi-Tool Support)

If your project uses multiple AI tools (Claude Code, GitHub Copilot, Cursor, etc.), add this section to CLAUDE.md to ensure consistent memory-aware behavior across tools.

**Only needed if:**
- Your project has a CLAUDE.md file, OR
- You explicitly support multiple AI coding tools

Otherwise, just use the AGENTS.md configuration (primary entrypoint).

---

## Project Memory System

This project maintains institutional knowledge in `docs/project-notes/` for consistency across sessions and AI tools.

### Memory Files

- **bugs.md** - Bug log with dates, solutions, and prevention notes
- **decisions.md** - Architectural Decision Records (ADRs) with context and trade-offs
- **key_facts.md** - Project configuration (non-secret), ports, important URLs. Do not store credentials or secrets here; use the project's approved secret-management mechanism instead.
- **issues.md** - Work log with ticket IDs, descriptions, and URLs

### Memory-Aware Protocols

**Before proposing architectural changes:**
- Check `docs/project-notes/decisions.md` for existing decisions
- Verify the proposed approach doesn't conflict with past choices
- If it does conflict, acknowledge the existing decision and explain why a change is warranted

**When encountering errors or bugs:**
- Search `docs/project-notes/bugs.md` for similar issues
- Apply known solutions if found
- Document new bugs and solutions when resolved

**When looking up project configuration:**
- Check `docs/project-notes/key_facts.md` for non-sensitive connection info: ports, hostnames, service names, URLs
- For credentials, API keys, passwords, and service account details, refer to the project's secret-management mechanism (environment variables, HashiCorp Vault, cloud provider secrets manager, etc.)
- Prefer documented facts over assumptions

**When completing work on tickets:**
- Log completed work in `docs/project-notes/issues.md`
- Include ticket ID, date, brief description, and URL

**When user requests memory updates:**
- Update the appropriate memory file (bugs, decisions, key_facts, or issues)
- Follow the established format and style (bullet lists, dates, concise entries)

**After high-value codebase changes:**
- Proactively suggest a memory update when a change is likely useful long-term knowledge
- Keep the prompt lightweight (one short suggestion)
- Ask for confirmation before writing entries to memory files

### Task Completion Protocol

When a feature, fix, or module reaches a stable state, follow this protocol to ensure high-value changes are captured:

**Defining "stable state":**
- Feature builds successfully end-to-end
- All targeted functionality verified working
- Integration tests pass (if applicable)
- User confirms expected behavior

**High-value change indicators (ANY met = should document):**
- ✅ Changes across 3+ files
- ✅ New build target/CMake option added
- ✅ New backend/module/subsystem implemented
- ✅ Architectural trade-off decision made
- ✅ Configuration facts needed by future users
- ✅ Dependency or protocol behavior changes
- ✅ Process/workflow changes affecting contributors

**Completion checklist:**
1. Feature works end-to-end (confirmed, not assumed)
2. **Evaluate memory urgency:**
   - Does this change warrant `decisions.md` entry? (Why was this chosen over alternatives?)
   - Does this require `key_facts.md` entry? (Configuration/constraints future developers need?)
   - Does this require `issues.md` entry? (Completion log for traceability?)
   - Does this need `bugs.md` entry? (If fixing a recurring issue, document root cause + prevention)
3. If YES to any above: **Proactively suggest** — "This looks like a high-value change. Recommend updating project memory for decisions/key_facts/issues. Shall I add it?"
4. Get user confirmation before writing entries
5. Update memory files before considering task complete

**Why this matters:**
- Future developers understand *why* decisions were made
- Configurations/constraints documented prevent repeated troubleshooting
- Work log provides traceability and institutional memory
- High-value insights captured while context is fresh

---

## Verification Checklist

After adding this section to CLAUDE.md, verify it contains all four required markers (same as AGENTS.md):
- `## Project Memory System` ✓
- `After high-value codebase changes:` ✓
- `## Task Completion Protocol` ✓
- `High-value change indicators (ANY met = should document):` ✓

If any marker is missing, configuration is incomplete.
