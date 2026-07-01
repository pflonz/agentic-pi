#!/usr/bin/env bash
# init_ai_augments.sh
# Idempotent initializer for the using-ai-augments skill.
#
# What it does (in order):
#   1. Detects AGENTS.md / CLAUDE.md at the project root.
#   2. For each present agent config, verifies the two required markers:
#        - "## AI Augments Skills"
#        - "skill-driven workflow"
#   3. If any marker is missing, appends the corresponding section from
#      references/<AGENTS|CLAUDE>-augments-section.md, preserving that
#      file's documented order.
#   4. Prints a final summary so the calling agent can report changes.
#
# Usage:
#   ./scripts/init_ai_augments.sh            # uses current directory
#   ./scripts/init_ai_augments.sh /path/to/repo
#
# Exit codes:
#   0 = success (already in place OR initialized cleanly)
#   1 = fatal error (e.g. references missing)

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------
TARGET_DIR="${1:-$PWD}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd)"
REFERENCES_DIR="$SKILL_DIR/references"

AGENTS_REF="$REFERENCES_DIR/AGENTS-augments-section.md"
CLAUDE_REF="$REFERENCES_DIR/CLAUDE-augments-section.md"

AGENTS_FILE="$TARGET_DIR/AGENTS.md"
CLAUDE_FILE="$TARGET_DIR/CLAUDE.md"

# Required markers (verbatim substrings) every configured file must contain.
REQUIRED_MARKERS=(
  "## AI Augments Skills"
  "skill-driven workflow"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { printf '[using-ai-augments] %s\n' "$*"; }
fail() { printf '[using-ai-augments] ERROR: %s\n' "$*" >&2; exit 1; }

# Verify all required skill references are present.
[[ -f "$AGENTS_REF" ]] || fail "missing reference: $AGENTS_REF"
[[ -f "$CLAUDE_REF" ]] || fail "missing reference: $CLAUDE_REF"
[[ -d "$TARGET_DIR" ]] || fail "target directory does not exist: $TARGET_DIR"

PATCHED_FILES=()

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
    "## AI Augments Skills" \
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
# Agent config files (AGENTS.md primary, CLAUDE.md optional)
# ---------------------------------------------------------------------------
log "target: $TARGET_DIR"
ensure_agent_config "$AGENTS_FILE" "$AGENTS_REF" "AGENTS"
ensure_agent_config "$CLAUDE_FILE" "$CLAUDE_REF" "CLAUDE"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
log "==== summary ===="
if [[ ${#PATCHED_FILES[@]} -gt 0 ]]; then
  log "patched agent configs (in reference order):"
  for f in "${PATCHED_FILES[@]}"; do log "  ~ $f"; done
else
  log "no agent configs needed patching"
fi

log "done."