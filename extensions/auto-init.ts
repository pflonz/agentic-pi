import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * auto-init.ts — first-run bootstrap for the agentic-pi package.
 *
 * Each supported skill registers a `SkillInit` entry below. The
 * extension then exposes three behaviors:
 *
 *   1. On session_start, write ~/.pi/agent/.agentic-pi-initialized once.
 *      This is the only fully automatic side-effect; it just marks
 *      "this machine has the agentic-pi package installed" so the
 *      welcome notification only shows on first run.
 *
 *   2. /agentic-pi-init — explicit opt-in for the using-ai-augments
 *      skill (the default).
 *      /agentic-pi-init-project-memory — opt-in for project-memory.
 *      Both append the corresponding section to AGENTS.md / CLAUDE.md
 *      and (for project-memory) create the docs/project-notes/
 *      starter files.
 *
 *   3. /agentic-pi-init-status — diagnostic command listing marker
 *      state for every supported skill.
 *
 * We deliberately do NOT auto-modify any project's AGENTS.md, and
 * we refuse to create missing AGENTS.md / CLAUDE.md — that's a user
 * policy decision. We DO create docs/project-notes/* starter files
 * when the user opts in to project-memory, because that's what
 * skills/project-memory/scripts/init_project_memory.sh does.
 *
 * Conventions mirrored from:
 *   skills/using-ai-augments/scripts/init_ai_augments.sh
 *   skills/project-memory/scripts/init_project_memory.sh
 *
 * Section content lives in:
 *   skills/<skill-dir>/references/AGENTS-<skill>.md
 *   skills/<skill-dir>/references/CLAUDE-<skill>.md
 */

const MARKER_DIR = join(homedir(), ".pi", "agent");
const PACKAGE_MARKER_FILE = join(MARKER_DIR, ".agentic-pi-initialized");

/**
 * Per-skill initializer spec.
 *
 * - skillDir: directory under skills/ in the package root
 * - referenceBase: prefix for the AGENTS/CLAUDE reference markdown files
 *   (full filenames are `${referenceBase}-AGENTS.md` and
 *   `${referenceBase}-CLAUDE.md` after the variant — see below).
 * - endMarkers: the unique last-line marker for each variant's section,
 *   used to bound the extract from the reference file.
 * - requiredMarkers: substrings that must be present in AGENTS.md /
 *   CLAUDE.md for init to consider the section already applied.
 * - machineMarker: optional separate per-skill marker file (in
 *   ~/.pi/agent/). When set, the welcome notification includes
 *   skill-specific guidance.
 * - extras: optional side-effects (e.g. create docs/project-notes/).
 */
type SkillInit = {
  name: string;
  skillDir: string;
  referenceBasename: string; // e.g. "AGENTS-augments-section"
  endMarkers: { AGENTS: string; CLAUDE: string };
  requiredMarkers: readonly string[];
  machineMarker?: string;
  extras?: (cwd: string) => string[];
};

const SKILL_INITS: SkillInit[] = [
  {
    name: "using-ai-augments",
    skillDir: "using-ai-augments",
    referenceBasename: "augments-section",
    endMarkers: {
      AGENTS: "If any marker is missing, initialization is incomplete.",
      CLAUDE: "If any marker is missing, initialization is incomplete.",
    },
    requiredMarkers: ["## AI Augments Skills", "skill-driven workflow"],
  },
  {
    name: "project-memory",
    skillDir: "project-memory",
    referenceBasename: "memory-section",
    endMarkers: {
      // The two variants use slightly different wording on their last
      // line — that is intentional, mirrors scripts/init_project_memory.sh.
      AGENTS: "If any marker is missing, initialization is incomplete.",
      CLAUDE: "If any marker is missing, configuration is incomplete.",
    },
    requiredMarkers: [
      "## Project Memory System",
      "After high-value codebase changes:",
      "## Task Completion Protocol",
      "High-value change indicators (ANY met = should document):",
    ],
    extras: (cwd: string): string[] => {
      const notesDir = join(cwd, "docs", "project-notes");
      mkdirSync(notesDir, { recursive: true });

      const starters: Array<{ path: string; title: string; purpose: string }> = [
        { path: join(notesDir, "bugs.md"), title: "Bug Log", purpose: "Resolved defects with root cause and prevention notes." },
        { path: join(notesDir, "decisions.md"), title: "Architectural Decisions", purpose: "ADRs (context, decision, alternatives, consequences)." },
        { path: join(notesDir, "key_facts.md"), title: "Key Facts", purpose: "Non-sensitive configuration (ports, URLs, build presets). No secrets." },
        { path: join(notesDir, "issues.md"), title: "Work Log", purpose: "Completed work log linked to ticket IDs and URLs." },
      ];

      const created: string[] = [];
      for (const s of starters) {
        if (!existsSync(s.path)) {
          writeFileSync(
            s.path,
            `# ${s.title}\n\n> ${s.purpose}\n\n## Entries\n\n_No entries yet._\n`,
            "utf-8",
          );
          created.push(s.path);
        }
      }
      return [
        `docs/project-notes/: ensured (${existsSync(notesDir) ? "exists" : "created"})`,
        `starter files: ${created.length === 0 ? "all present" : "created " + created.join(", ")}`,
      ];
    },
  },
];

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
    join(homedir(), ".pi", "agent", "git", "github.com", "pflonz", "agentic-pi"),
    join(homedir(), ".pi", "agent", "git", "github.com", "earendil-works", "agentic-pi"),
    join(homedir(), ".pi", "agent", "extensions", "agentic-pi"),
    // Dev / vendored copy: this file lives at <root>/extensions/auto-init.ts
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
 * Read the section block for a skill+variant from its reference file.
 *
 * Reference files use sentinel headings to delimit the section:
 *   start = "## <skill heading>"
 *   end   = <variant-specific end marker>
 *
 * This mirrors the awk-based extraction in init_*.sh so all paths
 * (shell script, this extension) produce identical output.
 */
function readSection(
  packageRoot: string,
  spec: SkillInit,
  variant: "AGENTS" | "CLAUDE",
): string | undefined {
  // Filename convention: `${VARIANT}-${referenceBasename}.md`
  // e.g. AGENTS-augments-section.md, CLAUDE-memory-section.md
  const refFile = join(
    packageRoot,
    "skills",
    spec.skillDir,
    "references",
    `${variant}-${spec.referenceBasename}.md`,
  );
  if (!existsSync(refFile)) return undefined;

  const content = readFileSync(refFile, "utf-8");
  const lines = content.split("\n");

  // requiredMarkers[0] already includes the leading "##" (e.g. "## AI Augments Skills").
  // The reference file's section starts with that exact heading line.
  const startHeading = spec.requiredMarkers[0];

  const startIdx = lines.findIndex((line: string) => line === startHeading);
  if (startIdx === -1) return undefined;
  const start = startIdx > 0 && lines[startIdx - 1].trim() === "---" ? startIdx - 1 : startIdx;

  const endMarker = spec.endMarkers[variant];
  const endIdx = lines.findIndex(
    (line: string, idx: number) => idx > startIdx && line === endMarker,
  );
  if (endIdx === -1) return undefined;

  return lines.slice(start, endIdx + 1).join("\n");
}

function hasAllMarkers(filePath: string, markers: readonly string[]): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf-8");
  return markers.every((marker) => content.includes(marker));
}

/**
 * Append the section block to a file if its required markers are
 * missing. Refuses to create new AGENTS.md / CLAUDE.md — that's a
 * user-policy decision.
 */
function appendSectionIfMissing(
  filePath: string,
  section: string,
  markers: readonly string[],
): "appended" | "already-present" | "missing-parent-file" {
  if (hasAllMarkers(filePath, markers)) return "already-present";
  if (!existsSync(filePath)) return "missing-parent-file";
  const prefix = readFileSync(filePath, "utf-8").endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(filePath, readFileSync(filePath, "utf-8") + prefix + section + "\n", "utf-8");
  return "appended";
}

/**
 * Run a single skill's per-project initializer. Mirrors the equivalent
 * shell script in skills/<dir>/scripts/.
 *
 *   - Check AGENTS.md, append if missing markers.
 *   - Check CLAUDE.md, append if present and missing markers.
 *   - Skip files that don't exist (don't create them).
 *   - Run any skill-specific extras (e.g. create docs/project-notes/).
 */
async function runProjectInit(cwd: string, spec: SkillInit): Promise<string> {
  const packageRoot = findPackageRoot();
  if (!packageRoot) {
    return `agentic-pi package root not found on disk. Expected ` +
      "skills/using-ai-augments/SKILL.md under ~/.pi/agent/git/.../agentic-pi or similar.";
  }

  const agentsSection = readSection(packageRoot, spec, "AGENTS");
  const claudeSection = readSection(packageRoot, spec, "CLAUDE");
  if (!agentsSection || !claudeSection) {
    return `agentic-pi package found at ${packageRoot}, but reference sections for ` +
      `${spec.name} are missing or malformed. Reinstall the package.`;
  }

  const results: string[] = [`Skill: ${spec.name}`];

  const agentsResult = appendSectionIfMissing(
    join(cwd, "AGENTS.md"),
    agentsSection,
    spec.requiredMarkers,
  );
  results.push(`  AGENTS.md: ${agentsResult}`);

  const claudePath = join(cwd, "CLAUDE.md");
  if (existsSync(claudePath)) {
    const claudeResult = appendSectionIfMissing(claudePath, claudeSection, spec.requiredMarkers);
    results.push(`  CLAUDE.md: ${claudeResult}`);
  } else {
    results.push("  CLAUDE.md: not present (skipped — will be patched if you create it later)");
  }

  if (spec.extras) {
    const extras = spec.extras(cwd);
    for (const e of extras) results.push(`  ${e}`);
  }

  return results.join("\n");
}

function findSkill(specName: string): SkillInit | undefined {
  return SKILL_INITS.find((s) => s.name === specName);
}

export default function (pi: ExtensionAPI) {
  // -------- First-run marker (machine-scoped, silent) --------
  pi.on("session_start", async (_event, ctx) => {
    if (existsSync(PACKAGE_MARKER_FILE)) return;

    try {
      mkdirSync(MARKER_DIR, { recursive: true });
      writeFileSync(
        PACKAGE_MARKER_FILE,
        [
          "# agentic-pi first-run marker",
          `# Created: ${new Date().toISOString()}`,
          "# Delete this file to re-trigger the first-run notification.",
          "",
        ].join("\n"),
        "utf-8",
      );
      ctx.ui.notify(
        "agentic-pi: installed. " +
          "Run /agentic-pi-init for the skill-driven workflow, " +
          "or /agentic-pi-init-project-memory to set up docs/project-notes/.",
        "info",
      );
    } catch (err) {
      ctx.ui.notify(
        `agentic-pi: failed to write first-run marker (${(err as Error).message}).`,
        "error",
      );
    }
  });

  // -------- Per-skill init commands (explicit, opt-in) --------
  for (const spec of SKILL_INITS) {
    const commandName = spec.name === "using-ai-augments"
      ? "agentic-pi-init"
      : `agentic-pi-init-${spec.name}`;

    pi.registerCommand(commandName, {
      description: `Initialize the ${spec.name} skill for the current project (patches AGENTS.md / CLAUDE.md${spec.extras ? " and creates skill-specific files" : ""})`,
      handler: async (_args, ctx) => {
        const summary = await runProjectInit(ctx.cwd, spec);
        ctx.ui.notify(summary, "info");
      },
    });
  }

  // -------- Status / diagnostics --------
  pi.registerCommand("agentic-pi-init-status", {
    description: "Show initialization state for every supported agentic-pi skill",
    handler: async (_args, ctx) => {
      const lines: string[] = [];

      lines.push(`Package marker: ${existsSync(PACKAGE_MARKER_FILE) ? "present" : "MISSING"}`);
      lines.push(`Package root: ${findPackageRoot() ?? "not found"}`);

      for (const spec of SKILL_INITS) {
        lines.push("");
        lines.push(`Skill: ${spec.name}`);
        const agentsPath = join(ctx.cwd, "AGENTS.md");
        const claudePath = join(ctx.cwd, "CLAUDE.md");
        lines.push(`  AGENTS.md: ${existsSync(agentsPath) ? (hasAllMarkers(agentsPath, spec.requiredMarkers) ? "marked" : "exists, no markers") : "absent"}`);
        lines.push(`  CLAUDE.md: ${existsSync(claudePath) ? (hasAllMarkers(claudePath, spec.requiredMarkers) ? "marked" : "exists, no markers") : "absent"}`);
        if (spec.name === "project-memory") {
          const notesDir = join(ctx.cwd, "docs", "project-notes");
          lines.push(`  docs/project-notes/: ${existsSync(notesDir) ? "present" : "absent"}`);
        }
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}