import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * auto-init.ts — first-run bootstrap for the agentic-pi package.
 *
 * Goals:
 *   1. Detect when this package is freshly installed on a machine
 *      (no ~/.pi/agent/.agentic-pi-initialized marker) and silently
 *      create the marker. This is the only automatic side-effect.
 *   2. Register `/agentic-pi-init` as an explicit, opt-in command
 *      that runs the project-local initializer (writes the
 *      `## AI Augments Skills` section to AGENTS.md / CLAUDE.md).
 *   3. Register `/agentic-pi-init-status` so the user can see what
 *      state the current project is in.
 *
 * We deliberately do NOT auto-modify any project's AGENTS.md.
 * Modifying a project's agent config without consent is too aggressive;
 * the user runs `/agentic-pi-init` once per project.
 *
 * Conventions mirrored from skills/using-ai-augments/scripts/init_ai_augments.sh
 * and skills/project-memory/scripts/init_project_memory.sh. The required
 * markers and section content live in
 * skills/using-ai-augments/references/AGENTS-augments-section.md and
 * skills/CLAUDE-augments-section.md.
 */

const MARKER_DIR = join(homedir(), ".pi", "agent");
const MARKER_FILE = join(MARKER_DIR, ".agentic-pi-initialized");

const REQUIRED_MARKERS = [
  "## AI Augments Skills",
  "skill-driven workflow",
] as const;

/**
 * Locate the agentic-pi package root on disk.
 *
 * Pi clones git packages to ~/.pi/agent/git/<host>/<path>/ and copies
 * extensions into the discoverable locations. We try a few candidate
 * paths. If none match, init falls back to a runtime path-resolution
 * attempt; if that also fails, the user sees a clear error from the
 * command rather than a silent no-op.
 */
function findPackageRoot(): string | undefined {
  const candidates = [
    // Git package install
    join(homedir(), ".pi", "agent", "git", "github.com", "pflonz", "agentic-pi"),
    join(homedir(), ".pi", "agent", "git", "github.com", "earendil-works", "agentic-pi"),
    // Symlinked or vendored copy
    join(homedir(), ".pi", "agent", "extensions", "agentic-pi"),
    // Same-directory dev workflow (this file's parent)
    dirname(dirname(new URL(import.meta.url).pathname)),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "skills", "using-ai-augments", "SKILL.md"))) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Read the agentic-pi section block from a reference markdown file.
 *
 * The reference files use sentinel headings to delimit the section:
 *   start = "## AI Augments Skills"
 *   end   = "If any marker is missing, initialization is incomplete."
 *
 * This mirrors the awk-based extraction in init_ai_augments.sh so the
 * two paths produce identical output.
 */
function readAugmentsSection(packageRoot: string, variant: "AGENTS" | "CLAUDE"): string | undefined {
  const refFile = join(
    packageRoot,
    "skills",
    "using-ai-augments",
    "references",
    `${variant}-augments-section.md`,
  );
  if (!existsSync(refFile)) return undefined;

  const content = readFileSync(refFile, "utf-8");
  const lines = content.split("\n");

  const startIdx = lines.findIndex((line: string) => line === "## AI Augments Skills");
  if (startIdx === -1) return undefined;
  // Backtrack to include the leading "---" separator if present.
  const start = startIdx > 0 && lines[startIdx - 1].trim() === "---" ? startIdx - 1 : startIdx;

  const endIdx = lines.findIndex(
    (line: string, idx: number) => idx > startIdx && line === "If any marker is missing, initialization is incomplete.",
  );
  if (endIdx === -1) return undefined;

  return lines.slice(start, endIdx + 1).join("\n");
}

function hasAllMarkers(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf-8");
  return REQUIRED_MARKERS.every((marker) => content.includes(marker));
}

function appendSectionIfMissing(filePath: string, section: string): "appended" | "already-present" | "missing-parent-dir" {
  if (hasAllMarkers(filePath)) return "already-present";
  // Refuse to create new AGENTS.md / CLAUDE.md — that is a user decision.
  if (!existsSync(filePath)) return "missing-parent-dir";
  // Ensure trailing newline before our appended block.
  const prefix = readFileSync(filePath, "utf-8").endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(filePath, readFileSync(filePath, "utf-8") + prefix + section + "\n", "utf-8");
  return "appended";
}

/**
 * Run the per-project initializer. Mirrors scripts/init_ai_augments.sh:
 *   - Check AGENTS.md, append if missing markers.
 *   - Check CLAUDE.md, append if present and missing markers.
 *   - Skip files that don't exist (don't create them).
 * Returns a human-readable summary the caller can show via ctx.ui.notify.
 */
async function runProjectInit(cwd: string): Promise<string> {
  const packageRoot = findPackageRoot();
  if (!packageRoot) {
    return "Could not locate the agentic-pi package root on disk. " +
      "Expected skills/using-ai-augments/SKILL.md under ~/.pi/agent/git/.../agentic-pi or a similar location.";
  }

  const agentsSection = readAugmentsSection(packageRoot, "AGENTS");
  const claudeSection = readAugmentsSection(packageRoot, "CLAUDE");
  if (!agentsSection || !claudeSection) {
    return `agentic-pi package found at ${packageRoot}, but the reference sections are missing or malformed. ` +
      "Reinstall the package.";
  }

  const results: string[] = [];
  const agentsFile = join(cwd, "AGENTS.md");
  const claudeFile = join(cwd, "CLAUDE.md");

  const agentsResult = appendSectionIfMissing(agentsFile, agentsSection);
  results.push(`AGENTS.md: ${agentsResult}`);

  if (existsSync(claudeFile)) {
    const claudeResult = appendSectionIfMissing(claudeFile, claudeSection);
    results.push(`CLAUDE.md: ${claudeResult}`);
  } else {
    results.push("CLAUDE.md: not present (skipped — will be patched if you create it later)");
  }

  return results.join("\n");
}

export default function (pi: ExtensionAPI) {
  // -------- First-run marker (machine-scoped, silent) --------
  pi.on("session_start", async (_event, ctx) => {
    if (existsSync(MARKER_FILE)) return;

    try {
      mkdirSync(MARKER_DIR, { recursive: true });
      writeFileSync(
        MARKER_FILE,
        [
          "# agentic-pi first-run marker",
          `# Created: ${new Date().toISOString()}`,
          "# Delete this file to re-trigger the first-run notification.",
          "",
        ].join("\n"),
        "utf-8",
      );
      ctx.ui.notify(
        "agentic-pi: installed. Run /agentic-pi-init in any project to enable the skill-driven workflow.",
        "info",
      );
    } catch (err) {
      ctx.ui.notify(
        `agentic-pi: failed to write first-run marker (${(err as Error).message}). ` +
          "Run /agentic-pi-init-status to diagnose.",
        "error",
      );
    }
  });

  // -------- Per-project init (explicit, opt-in) --------
  pi.registerCommand("agentic-pi-init", {
    description: "Initialize the skill-driven workflow for the current project (patches AGENTS.md / CLAUDE.md)",
    handler: async (_args, ctx) => {
      const summary = await runProjectInit(ctx.cwd);
      ctx.ui.notify(summary, "info");
    },
  });

  // -------- Status / diagnostics --------
  pi.registerCommand("agentic-pi-init-status", {
    description: "Show whether agentic-pi and the skill-driven workflow are initialized",
    handler: async (_args, ctx) => {
      const lines: string[] = [];

      lines.push(`Machine marker: ${existsSync(MARKER_FILE) ? "present" : "MISSING"} (${MARKER_FILE})`);
      lines.push(`Package root: ${findPackageRoot() ?? "not found"}`);
      lines.push(`AGENTS.md markers: ${hasAllMarkers(join(ctx.cwd, "AGENTS.md")) ? "present" : "missing"}`);
      lines.push(`CLAUDE.md markers: ${hasAllMarkers(join(ctx.cwd, "CLAUDE.md")) ? "present" : "missing or no file"}`);

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}