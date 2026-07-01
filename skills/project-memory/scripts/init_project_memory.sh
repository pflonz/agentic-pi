#!/usr/bin/env bash
# init_project_memory.sh
# Idempotent initializer for the project-memory skill.
#
# What it does (in order):
#   1. Ensures docs/project-notes/ exists.
#   2. Ensures the four starter files exist (bugs.md, decisions.md,
#      key_facts.md, issues.md) with minimal content only.
#   3. Detects AGENTS.md / CLAUDE.md at the project root.
#   4. For each present agent config, verifies the four required markers.
#   5. If any marker is missing, appends the corresponding section from
#      references/<AGENTS|CLAUDE>-memory-section.md, preserving that
#      file's documented order.
#   6. Prints a final summary so the calling agent can report changes.
#
# Usage:
#   ./scripts/init_project_memory.sh            # uses current directory
#   ./scripts/init_project_memory.sh /path/to/repo
#
# Exit codes:
#   0 = success (everything already in place OR initialized cleanly)
#   1 = fatal error (e.g. references missing)

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------
TARGET_DIR="${1:-$PWD}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd)"
REFERENCES_DIR="$SKILL_DIR/references"

NOTES_DIR="$TARGET_DIR/docs/project-notes"

AGENTS_REF="$REFERENCES_DIR/AGENTS-memory-section.md"
CLAUDE_REF="$REFERENCES_DIR/CLAUDE-memory-section.md"

AGENTS_FILE="$TARGET_DIR/AGENTS.md"
CLAUDE_FILE="$TARGET_DIR/CLAUDE.md"

# Required markers (verbatim substrings) every configured file must contain.
REQUIRED_MARKERS=(
  "## Project Memory System"
  "After high-value codebase changes:"
  "## Task Completion Protocol"
  "High-value change indicators (ANY met = should document):"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '[project-memory] %s\n' "$*"; }
fail() { printf '[project-memory] ERROR: %s\n' "$*" >&2; exit 1; }

# Verify all required skill references are present.
[[ -f "$AGENTS_REF" ]] || fail "missing reference: $AGENTS_REF"
[[ -f "$CLAUDE_REF" ]] || fail "missing reference: $CLAUDE_REF"
[[ -d "$TARGET_DIR" ]] || fail "target directory does not exist: $TARGET_DIR"

CREATED_NOTES_DIR=0
CREATED_FILES=()
PATCHED_FILES=()

ensure_dir() {
  if [[ ! -d "$1" ]]; then
    mkdir -p "$1"
    CREATED_NOTES_DIR=1
    log "created directory: $1"
  fi
}

write_minimal_starter() {
  local path="$1" title="$2" purpose="$3"
  if [[ -f "$path" ]]; then
    log "exists, skipping: $path"
    return 0
  fi
  {
    printf '# %s\n\n' "$title"
    printf '> %s\n\n' "$purpose"
    printf '## Entries\n\n'
    printf '_No entries yet._\n'
  } > "$path"
  CREATED_FILES+=("$path")
  log "created starter file: $path"
}

file_has_marker() {
  local file="$1" marker="$2"
  grep -Fq -- "$marker" "$file"
}

file_missing_markers() {
  local file="$1"
  local missing=()
  for marker in "${REQUIRED_MARKERS[@]}"; do
    if ! file_has_marker "$file" "$marker"; then
      missing+=("$marker")
    fi
  done
  printf '%s\n' "${missing[@]}"
}

# Extract the section block from the reference between two sentinel comments.
extract_section_block() {
  local ref_file="$1" start_marker="$2" end_marker="$3" out_file="$4"
  awk -v start="$start_marker" -v end="$end_marker" '
    $0 == start { capture = 1; print; next }
    $0 == end   { print; capture = 0; next }
    capture     { print }
  ' "$ref_file" > "$out_file"
}

ensure_agent_config() {
  local agent_file="$1" ref_file="$2" label="$3"
  local missing=()

  log "checking $label config: $agent_file"
  if [[ ! -f "$agent_file" ]]; then
    log "no $label.md found at project root; skipping patch step"
    return 0
  fi

  while IFS= read -r line; do
    [[ -n "$line" ]] && missing+=("$line")
  done < <(file_missing_markers "$agent_file")

  if [[ ${#missing[@]} -eq 0 ]]; then
    log "$label.md already contains all required markers"
    return 0
  fi

  log "$label.md is missing ${#missing[@]} marker(s); appending section"
  log "missing: $(printf '%s | ' "${missing[@]}")"

  local tmp_block
  tmp_block="$(mktemp)"
  # Sentinels must match the reference files verbatim.
  extract_section_block "$ref_file" \
    "## Project Memory System" \
    "If any marker is missing, initialization is incomplete." \
    "$tmp_block"

  {
    printf '\n'
    cat "$tmp_block"
  } >> "$agent_file"

  rm -f "$tmp_block"
  PATCHED_FILES+=("$agent_file")

  # Re-verify so the final report reflects reality.
  local still_missing=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && still_missing+=("$line")
  done < <(file_missing_markers "$agent_file")

  if [[ ${#still_missing[@]} -ne 0 ]]; then
    fail "$label.md still missing markers after patch: $(printf '%s | ' "${still_missing[@]}")"
  fi
}

# ---------------------------------------------------------------------------
# 1. Notes directory
# ---------------------------------------------------------------------------
log "target: $TARGET_DIR"
ensure_dir "$NOTES_DIR"

# ---------------------------------------------------------------------------
# 2. Starter files
# ---------------------------------------------------------------------------
write_minimal_starter "$NOTES_DIR/bugs.md" \
  "Bug Log" \
  "Resolved defects with root cause and prevention notes."

write_minimal_starter "$NOTES_DIR/decisions.md" \
  "Architectural Decisions" \
  "ADRs (context, decision, alternatives, consequences)."

write_minimal_starter "$NOTES_DIR/key_facts.md" \
  "Key Facts" \
  "Non-sensitive configuration (ports, URLs, build presets). No secrets."

write_minimal_starter "$NOTES_DIR/issues.md" \
  "Work Log" \
  "Completed work log linked to ticket IDs and URLs."

# ---------------------------------------------------------------------------
# 3 & 4. Agent config files (AGENTS.md primary, CLAUDE.md optional)
# ---------------------------------------------------------------------------
ensure_agent_config "$AGENTS_FILE" "$AGENTS_REF" "AGENTS"
ensure_agent_config "$CLAUDE_FILE" "$CLAUDE_REF" "CLAUDE"

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
echo
log "==== summary ===="
if [[ $CREATED_NOTES_DIR -eq 1 ]]; then
  log "created: docs/project-notes/"
else
  log "docs/project-notes/ already existed"
fi

if [[ ${#CREATED_FILES[@]} -gt 0 ]]; then
  log "created files:"
  for f in "${CREATED_FILES[@]}"; do log "  + $f"; done
else
  log "no starter files needed creating"
fi

if [[ ${#PATCHED_FILES[@]} -gt 0 ]]; then
  log "patched agent configs (in reference order):"
  for f in "${PATCHED_FILES[@]}"; do log "  ~ $f"; done
else
  log "no agent configs needed patching"
fi

log "done."