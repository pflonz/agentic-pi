# agentic-pi V-Model Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ai-augments:subagent-driven-development (recommended) or ai-augments:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `agentic-pi` into a portable Pi package that enforces an embedded V-Model + TDD workflow on the AI in every session, so firmware cannot be written without a failing test, a stated V-level, and a cited requirement.

**Architecture:** One persistent `EMBEDDED` mode (no mode cycle) injects a V-Model + TDD system prompt via the `before_agent_start` hook. Tasks are gated by V-level tags and require paired test tasks. Specialist agents split the V-Model phases (architect → test-designer → implementer → reviewer) with hard tool constraints from agent frontmatter. A chain runs the four roles sequentially. Workflow enforcement lives in three layers: injected system prompt (governance), task schema (mechanical gate), and agent tool restrictions (physical gate).

**Tech Stack:** TypeScript (Pi extensions), Markdown (skills, agents, context files, plans), `agent-pi` patterns (mode-cycler, tasks, planner/builder/tester/reviewer) lifted from `~/workspace/agent-pi/`. Pi API: `ExtensionAPI`, `before_agent_start`, `registerCommand`, `registerTool`, `registerShortcut`.

---

## Architecture Decisions (settled upfront — do not revisit)

1. **One mode, one workflow.** No mode cycler. `EMBEDDED` mode is the default and only mode. Mode-cycling was useful for `agent-pi` because it had 6 workflows; we have one.
2. **System prompt is the contract.** Workflow enforcement lives in the system prompt injected via `before_agent_start`. The agent cannot "forget" what it was told to do because the prompt is rebuilt every turn.
3. **Agent frontmatter constrains tools.** Read-only agents literally cannot write code. The V-Model phases become physically enforceable, not just morally.
4. **No multi-agent orchestration in v1.** No `agent-team`, no `agent-chain`, no `pipeline-team`. A single sequential chain (Phase 4) is sufficient. We add multi-agent only if the chain proves insufficient.
5. **Toolchain-agnostic at the core.** Phases 0–4 work for any MCU/test framework. Toolchain specifics live in Phase 5 skills.
6. **`AGENTS.md`, not `CLAUDE.md`.** Future-proof, cross-tool. Symlink `CLAUDE.md → AGENTS.md` for Claude Code compatibility.
7. **TDD applied to building the tool itself.** This plan follows the writing-plans skill: tests/smoke-checks for every task, frequent commits.

## What we explicitly do NOT copy from `agent-pi`

- 43-extension breadth — UI fluff, browser viewers, security guards (until proven needed)
- 6-mode cycle — irrelevant for a single-workflow tool
- Multi-model builders, OAuth, Commander sync — out of scope
- Theme/sound/ASCII banner — nice-to-have, not v1
- Extension test suite (`extensions/__tests__/`) — overkill for prompt-driven tools

## Scope Check

This plan covers one subsystem: the workflow-enforcement layer of `agentic-pi`. It does not cover:

- Concrete MCU toolchain integration (deferred to Phase 5)
- MISRA / static-analysis integration (deferred to Phase 5)
- Hardware-in-loop test infrastructure (deferred to Phase 5)
- Physical guard extension for `.c`-without-`.c.test.c` (deferred to Phase 6)

Phases 0–4 each produce a working, testable subsystem. Phases 5–6 will be re-planned in separate documents when their prerequisites are resolved.

---

## File Structure

**Created:**

| File | Phase | Purpose |
|------|-------|---------|
| `AGENTS.md` | 0 | Context file — workflow rules loaded every session |
| `CLAUDE.md` | 0 | Symlink → `AGENTS.md` (Claude Code compatibility) |
| `package.json` | 0 | Tells pi which directories to load |
| `skills/vmodel-embedded/SKILL.md` | 0 | V-Model reference, loaded on demand |
| `extensions/vmodel-cycler.ts` | 1 | Mode-locked enforcer + prompt injector |
| `extensions/lib/vmodel-prompt.ts` | 1 | The injected system prompt (governance contract) |
| `extensions/vmodel-tasks.ts` | 2 | Test-gated task discipline |
| `agents/vmodel-architect.md` | 3 | Read-only spec decomposer |
| `agents/vmodel-test-designer.md` | 3 | Writes failing tests only |
| `agents/vmodel-implementer.md` | 3 | Implements to pass tests |
| `agents/vmodel-reviewer.md` | 3 | Coverage, static analysis, traceability |
| `agents/teams.yaml` | 3 | Group the four agents |
| `agents/vmodel-chain.yaml` | 4 | Sequential V-Model chain |
| `docs/project-notes/plans/2026-07-01-agentic-pi-vmodel-workflow.md` | 0 | This file |

**Modified:**

| File | Phase | Change |
|------|-------|--------|
| `AGENTS.md` | 0 | Write from scratch (currently empty) |
| `README.md` | 1 | Document the EMBEDDED mode after Phase 1 lands |

**Referenced (read-only, from `~/workspace/agent-pi/`):**

- `extensions/mode-cycler.ts` — `before_agent_start` pattern
- `extensions/tasks.ts` (first ~100 lines) — task schema, gate pattern
- `extensions/agent-chain.ts` — chain execution (lifted as-is in Phase 4)
- `agents/planner.md` — read-only agent frontmatter
- `agents/builder.md` — full-tool agent frontmatter
- `agents/agent-chain.yaml` — chain YAML shape

---

## Phase 0 — Foundation

**Goal:** Load V-Model + TDD rules on every session via project conventions.

**Files:** `AGENTS.md`, `CLAUDE.md` (symlink), `package.json`, `skills/vmodel-embedded/SKILL.md`.

### Task 0.1: Create `AGENTS.md` with workflow rules

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write the AGENTS.md header and identity section**

Replace the empty `AGENTS.md` (currently 0 bytes) with the following content. The file uses markdown headings and bullet points — no code blocks, no emojis.

```markdown
# agentic-pi — Embedded V-Model + TDD Workflow

This file is loaded automatically by pi on every session. It is mandatory.

## Identity

You are working inside `agentic-pi`, a portable Pi package that enforces an embedded V-Model + TDD workflow on every agent invocation. Your job is to assist with embedded firmware development under the discipline below. There is no "casual mode" — the workflow applies every turn.

## V-Model Phases

You operate at one of these V-Model levels. State the level on every tool call.

| Level | Description | Verification on the right side of the V |
|-------|-------------|------------------------------------------|
| `requirements` | What the system shall do | Acceptance test |
| `system` | How components partition | System integration test |
| `component` | How one module behaves internally | Component test |
| `unit` | One function or register access | Unit test |

For any non-trivial work, identify the level before writing any code.

## TDD Discipline (non-negotiable)

For every change to production code:

1. **Write the failing test first.** Show the test code. Run it. See it fail.
2. **Write the minimal code to make the test pass.** Do not add features the test does not require.
3. **Refactor** while keeping tests green.
4. **Cite the requirement** (Req-ID or "derived from: …") the code traces to.

If you are about to write or modify production code without a paired test, stop and produce the test first.

## Hardware-touching Code

When code accesses a peripheral, register, or hardware-dependent API:

1. **Design the mock/contract first.** A header that exposes only what production code needs.
2. **Write the test against the mock.** Hardware is unavailable in unit tests; mock it.
3. **Implement against the mock.** Real HAL/driver calls happen only inside production code, never inside tests.

## Forbidden

- Production code without a failing test that subsequently passes.
- Mixing V-Model levels in one edit (e.g., fixing a unit bug by changing system-level abstractions).
- "Just write the code" responses that skip the workflow.
- Hallucinating register addresses, HAL function names, or peripheral layouts. If unsure, read the datasheet or vendor header.
- Emojis in any output.

## Workflow Acknowledgement

At the start of a multi-step task, briefly state: target V-level, requirements traced to, and test plan. One paragraph, no fluff.
```

- [ ] **Step 2: Verify the file was written**

Run: `wc -l AGENTS.md && head -5 AGENTS.md`
Expected: line count > 30 and first line is `# agentic-pi — Embedded V-Model + TDD Workflow`.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "feat(phase-0): add AGENTS.md with V-Model + TDD rules"
```

---

### Task 0.2: Create `CLAUDE.md` symlink

**Files:**
- Create: `CLAUDE.md` (symlink → `AGENTS.md`)

- [ ] **Step 1: Create the symlink**

Run:
```bash
ln -s AGENTS.md CLAUDE.md
```

- [ ] **Step 2: Verify the symlink resolves**

Run: `readlink CLAUDE.md && cat CLAUDE.md | head -3`
Expected: `AGENTS.md` and the first three lines match the AGENTS.md header.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "feat(phase-0): symlink CLAUDE.md to AGENTS.md"
```

---

### Task 0.3: Create `package.json`

**Files:**
- Create: `package.json`

Pi auto-discovers `extensions/`, `skills/`, `themes/`, `prompts/` by default, but explicit registration makes the package portable and self-documenting.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "agentic-pi",
  "version": "0.1.0",
  "description": "Portable Pi package — embedded V-Model + TDD workflow enforcement for firmware development",
  "private": true,
  "type": "module",
  "keywords": ["pi-package", "embedded", "v-model", "tdd"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "themes": ["./themes"],
    "prompts": ["./prompts"]
  },
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*"
  }
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).name)"`
Expected: `agentic-pi`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat(phase-0): add package.json registering extensions/skills/themes/prompts"
```

---

### Task 0.4: Create the `vmodel-embedded` skill

**Files:**
- Create: `skills/vmodel-embedded/SKILL.md`

The skill is loaded on demand (e.g. `/skill:vmodel-embedded`). It contains V-Model reference material the agent uses while implementing.

- [ ] **Step 1: Create the skill directory**

Run: `mkdir -p skills/vmodel-embedded`

- [ ] **Step 2: Write `SKILL.md`**

The file has YAML frontmatter followed by markdown body. Replace the entire file content with:

```markdown
---
name: vmodel-embedded
description: Embedded V-Model + TDD reference for C/C++/Rust firmware. Use whenever the task involves drivers, HAL, RTOS tasks, interrupt handlers, or any hardware-adjacent code.
---

# Embedded V-Model + TDD

Companion to `AGENTS.md`. Load this skill whenever firmware code is being written.

## The V-Model for Embedded

```
                    Requirements
                         |
                  Acceptance Test
        ----------------------------------
                System Design
                     |
              System Integration Test
        ----------------------------------
              Component Design
                     |
              Component Test
        ----------------------------------
                  Unit Design
                     |
                   Unit Test
        ----------------------------------
                 Implementation
```

The left side decomposes from requirement → implementation. The right side builds verification in parallel, from acceptance test down to unit test. Every artefact on the left has a paired test on the right.

## V-Level Decision Tree

Ask in this order. Stop at the first match.

1. Does the task define or change what the system shall do? → `requirements`
2. Does it change how components are partitioned or how they communicate? → `system`
3. Does it change one module's internal behaviour or its public contract? → `component`
4. Does it change one function, one register access, one state machine transition? → `unit`

If a task spans multiple levels, decompose it. One task = one level.

## TDD Cycle (firmware edition)

```
[ ] 1. Write failing test (Unity/CMock/GoogleTest)
[ ] 2. Run test — see RED
[ ] 3. Write minimal implementation
[ ] 4. Run test — see GREEN
[ ] 5. Refactor — keep GREEN
[ ] 6. Cite the requirement this code traces to in commit message
```

For hardware-touching code, replace step 1 with:

```
[ ] 1a. Design the mock/contract header (function signatures only)
[ ] 1b. Write the test that calls into the contract — see RED
[ ] 1c. Implement against the contract, mocking real HAL calls
[ ] 1d. Run test — see GREEN
```

## Hardware Mocking Patterns

| Peripheral | Mock strategy |
|------------|---------------|
| GPIO | Inject a fake register struct, replace read/write functions |
| UART | Ring buffer in RAM; mock TX/RX register side-effects |
| SPI / I2C | Mock transfer function with scripted byte sequences |
| Timer | Mock tick increment; control time in tests |
| Interrupt | Mock NVIC; call ISR directly with a fabricated context |
| DMA | Mock channel descriptor; assert configuration without real transfer |

The contract (mock or production) is the same function signature. Tests call the contract. Production wires it to real hardware.

## Requirement Traceability

Every commit message for production code should include a `Req:` line:

```
feat(uart): implement DMA-driven receive

Req: REQ-UART-007 (DMA mode for high-throughput RX)
Test: tests/test_uart.c::test_dma_receive_completes_on_idle_line
```

If there is no Req-ID (e.g., greenfield work), write `Req: derived from <parent task or stakeholder>`.

## Common Anti-patterns

- **Testing the implementation, not the contract.** Assert against observable behaviour, not internal state.
- **Hardware-dependent tests.** If a test needs a real peripheral to pass, the mock contract is wrong.
- **Skipping the failing-test step.** If you wrote code and a test exists but you never saw it fail, you do not know whether the test actually exercises the code.
- **Mixing V-levels.** A "unit fix" that requires changing the system architecture is a system-level task wearing a unit-level mask.
```

- [ ] **Step 3: Verify frontmatter parses**

Run: `head -5 skills/vmodel-embedded/SKILL.md`
Expected: the file starts with `---`, then `name: vmodel-embedded`, then `description: ...`, then `---`.

- [ ] **Step 4: Commit**

```bash
git add skills/vmodel-embedded/SKILL.md
git commit -m "feat(phase-0): add vmodel-embedded skill"
```

---

### Task 0.5: Smoke-test Phase 0

- [ ] **Step 1: Confirm both context files resolve**

Run:
```bash
ls -la AGENTS.md CLAUDE.md
cat CLAUDE.md | head -3
```
Expected: `CLAUDE.md -> AGENTS.md` and the first three lines match `AGENTS.md`.

- [ ] **Step 2: Confirm pi discovers the package contents**

Run: `pi list 2>/dev/null || ls extensions/ skills/ prompts/ themes/`
Expected: all four directories present, `extensions/` and `skills/vmodel-embedded/` non-empty.

- [ ] **Step 3: Verify package.json is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
Expected: no output (silent success).

---

## Phase 1 — Single-Mode Enforcer (Governance Core)

**Goal:** Inject the V-Model workflow prompt on every turn via `before_agent_start`. The AI cannot escape the workflow in default mode.

**Files:** `extensions/vmodel-cycler.ts`, `extensions/lib/vmodel-prompt.ts`. Modify: `README.md`.

**Reference:** `~/workspace/agent-pi/extensions/mode-cycler.ts` lines ~210–230 (`before_agent_start`), `~/workspace/agent-pi/extensions/lib/mode-prompts.ts`.

### Task 1.1: Create the prompt module

**Files:**
- Create: `extensions/lib/vmodel-prompt.ts`

The prompt is the governance contract. It will be refined over many sessions. Keep it long, sharp, and explicit.

- [ ] **Step 1: Create the lib directory**

Run: `mkdir -p extensions/lib`

- [ ] **Step 2: Write `vmodel-prompt.ts`**

```typescript
// ABOUTME: V-Model + TDD system prompt — injected on every agent turn.
// ABOUTME: This is the governance contract. Refine it; do not weaken it.

export const VMODEL_PROMPT = `You are operating inside agentic-pi, an embedded V-Model + TDD workflow enforcer. The following rules are non-negotiable on every turn of this conversation.

# Workflow Contract

## 1. Identify the V-level before any tool call

State the V-Model level for the work you are about to do:

- requirements — defining or changing what the system shall do
- system — partitioning components or defining their interfaces
- component — one module's internal behaviour or public contract
- unit — one function, register access, or state transition

If the task spans multiple levels, decompose it. One tool call sequence = one V-level.

## 2. Test-first for every production-code change

Before writing or modifying production code, you must:

a) Show the failing test code.
b) State the command to run it.
c) Predict the failure (which assertion, which message).
d) Run it (if you have execution) and confirm the prediction.

Only then may you write the minimal implementation that makes the test pass. After implementation, re-run the test and confirm it passes.

If the user asks for code without a test, refuse politely and produce the test first. Cite this prompt as the reason.

## 3. Hardware-touching code: contract first

For code that touches registers, peripherals, HAL calls, or RTOS primitives:

a) Define the contract (function signatures only) before any implementation.
b) Write the test against the contract. The test must not include real hardware calls.
c) Implement against the contract. Real HAL/driver code lives only in production source.

## 4. Requirement traceability

Every commit message and every production-code edit must cite the requirement it traces to. Format: \`Req: REQ-XXX-NNN\` or \`Req: derived from <parent>\`. If no requirement exists, propose one.

## 5. Forbidden behaviours

- Writing production code without a paired failing test that subsequently passes.
- Skipping V-level identification.
- "Just write the code" responses.
- Inventing register addresses, peripheral names, or HAL APIs. Read the vendor header or datasheet.
- Mixing V-levels in one edit.
- Emojis in any output.

# Acknowledgement format

When you begin a multi-step task, your first user-facing paragraph must contain, in this order:

1. Target V-level.
2. Requirement ID (or "derived from: …").
3. Test plan (which test, which framework, expected initial failure).
4. Then proceed.

# Failure mode

If the user gives an instruction that violates this contract, respond once with the violating instruction quoted and your proposed compliant sequence. Do not proceed with the violation. Do not lecture — propose, then act.

# Tool usage

You may use read, write, edit, bash, grep, find, ls as normal. You are encouraged to use them. The contract above governs the *order* and *gating* of tool calls, not their availability.`;
```

- [ ] **Step 3: Verify the file is syntactically valid TypeScript**

Run: `node --input-type=module -e "import('./extensions/lib/vmodel-prompt.ts').catch(e => { if (e.code === 'ERR_MODULE_NOT_FOUND') { console.log('TS-load: skip (expected without transpile)'); } else { throw e; } })" || echo "TypeScript load not available; verify by reading the file: cat extensions/lib/vmodel-prompt.ts | head -10"`
Expected: either the import resolves (with TS support) or the fallback prints `TypeScript load: skip (expected without transpile)`. Pi transpiles at runtime.

- [ ] **Step 4: Commit**

```bash
git add extensions/lib/vmodel-prompt.ts
git commit -m "feat(phase-1): add V-Model system prompt (governance contract)"
```

---

### Task 1.2: Create the cycler extension

**Files:**
- Create: `extensions/vmodel-cycler.ts`

The extension locks mode to `EMBEDDED`, sets the mode on `session_start`, and injects `VMODEL_PROMPT` via `before_agent_start`. There is no cycle — one mode, one workflow.

- [ ] **Step 1: Write `vmodel-cycler.ts`**

```typescript
// ABOUTME: Locks the operational mode to EMBEDDED and injects the V-Model + TDD
// ABOUTME: system prompt on every agent turn via before_agent_start.

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { writeFileSync } from "fs";

const MODE_FILE = "/tmp/pi-vmodel-mode.txt";

export default function (pi: ExtensionAPI) {
	let mode: "EMBEDDED" = "EMBEDDED";

	function publishMode(ctx: ExtensionContext | undefined) {
		(globalThis as any).__piCurrentMode = mode;
		try { writeFileSync(MODE_FILE, mode, "utf-8"); } catch {}
		if (ctx?.hasUI) ctx.ui.setStatus("mode", "EMBEDDED · V-Model");
	}

	// Lazy import — the prompt file lives in lib/.
	async function loadPrompt(): Promise<string> {
		const mod = await import("./lib/vmodel-prompt.ts");
		return mod.VMODEL_PROMPT;
	}

	// Session start — lock mode.
	pi.on("session_start", async (_event, ctx) => {
		mode = "EMBEDDED";
		publishMode(ctx);
	});

	// Session switch — re-apply (e.g. after /new).
	pi.on("session_switch", async (_event, ctx) => {
		publishMode(ctx);
	});

	// Governance core — inject prompt on every turn.
	pi.on("before_agent_start", async (_event, _ctx) => {
		const prompt = await loadPrompt();
		return { systemPrompt: prompt };
	});

	// Status command for sanity-checking.
	pi.registerCommand("vmodel-status", {
		description: "Print the current V-Model mode and prompt source",
		handler: async (_args, ctx) => {
			ctx.ui.notify(`Mode: ${mode} | Prompt: extensions/lib/vmodel-prompt.ts`, "info");
		},
	});
}
```

- [ ] **Step 2: Verify the extension file**

Run: `head -5 extensions/vmodel-cycler.ts && wc -l extensions/vmodel-cycler.ts`
Expected: `// ABOUTME: Locks the operational mode to EMBEDDED…` and a line count near 50.

- [ ] **Step 3: Commit**

```bash
git add extensions/vmodel-cycler.ts
git commit -m "feat(phase-1): add vmodel-cycler extension with locked EMBEDDED mode"
```

---

### Task 1.3: Document the mode in README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read the current README**

Run: `cat README.md`

- [ ] **Step 2: Add an "Embedded V-Model Mode" section**

Append the following section to `README.md` (preserve existing content):

```markdown

## Embedded V-Model Mode

`agentic-pi` runs in a single locked mode, `EMBEDDED`, that enforces a V-Model + TDD workflow on every agent turn. The system prompt is injected via `before_agent_start` and is non-bypassable inside the package.

- Workflow rules: [`AGENTS.md`](./AGENTS.md)
- V-Model reference: `/skill:vmodel-embedded`
- Governance extension: [`extensions/vmodel-cycler.ts`](./extensions/vmodel-cycler.ts)
- Injected prompt: [`extensions/lib/vmodel-prompt.ts`](./extensions/lib/vmodel-prompt.ts)

Verify mode with `/vmodel-status` inside a pi session.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(phase-1): document EMBEDDED mode in README"
```

---

### Task 1.4: Smoke-test Phase 1

The single critical test: does the agent actually follow the workflow? This is a manual behavioural test.

- [ ] **Step 1: Open a pi session in the agentic-pi directory**

Run: `cd /home/sebastian/workspace/agentic-pi && pi`
Expected: pi starts. Check the status line shows `EMBEDDED · V-Model`.

- [ ] **Step 2: Test the bypass-resistance prompt**

Inside pi, send the message: `Write me a UART driver for STM32, just the code, no tests.`

Expected behaviour: the agent quotes your instruction and proposes a compliant sequence (V-level identification → failing test → mock contract → implementation). It does not write production code.

If the agent writes code immediately, the prompt in `extensions/lib/vmodel-prompt.ts` needs sharpening. Edit it, restart pi, retest. Document the iteration in a commit message.

- [ ] **Step 3: Test the compliant path**

Send: `Implement a UART driver for STM32F4. Req: REQ-UART-001 (TX with polling, 115200 baud, 8N1). V-level: unit. Test framework: Unity + CMock.`

Expected behaviour: the agent states V-level (unit), cites REQ-UART-001, and proposes writing the mock contract + failing test before any production code.

- [ ] **Step 4: Commit any prompt refinements**

```bash
git add extensions/lib/vmodel-prompt.ts
git commit -m "refine(phase-1): tighten V-Model prompt based on smoke-test"
```

---

## Phase 2 — Test-Gated Task Extension

**Goal:** Add a mechanical gate: the agent cannot mark an implementation task `done` while its paired test task is not `done`. Independent of prompt compliance.

**Files:** `extensions/vmodel-tasks.ts`.

**Reference:** `~/workspace/agent-pi/extensions/tasks.ts` first ~100 lines (task schema, lifecycle, gate). Drop the Commander sync, theme polish, and viewer dependencies.

### Task 2.1: Design the task schema

Tasks have:
- `id` (number)
- `text` (string)
- `status` (`idle` | `inprogress` | `done`)
- `v_level` (`requirements` | `system` | `component` | `unit`)
- `kind` (`impl` | `test` | `spec` | `review`)
- `paired_with` (id of related task, e.g. an impl paired with its test)

Validation rules:
- An `impl` task must have a `paired_with` pointing to a `test` task.
- Marking an `impl` task `done` while its paired `test` task is not `done` returns an error.

### Task 2.2: Write the extension

**Files:**
- Create: `extensions/vmodel-tasks.ts`

- [ ] **Step 1: Write `vmodel-tasks.ts`**

```typescript
// ABOUTME: Test-gated task discipline for V-Model workflow.
// ABOUTME: An implementation task cannot be marked done until its paired test task is done.

import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type VLevel = "requirements" | "system" | "component" | "unit";
type TaskKind = "impl" | "test" | "spec" | "review";
type TaskStatus = "idle" | "inprogress" | "done";

interface Task {
	id: number;
	text: string;
	status: TaskStatus;
	v_level: VLevel;
	kind: TaskKind;
	paired_with?: number;
}

const VLEVELS: VLevel[] = ["requirements", "system", "component", "unit"];
const KINDS: TaskKind[] = ["impl", "test", "spec", "review"];

let tasks: Task[] = [];
let nextId = 1;

function findTask(id: number): Task | undefined {
	return tasks.find(t => t.id === id);
}

function validateDone(task: Task): string | null {
	if (task.status !== "done") return null;
	if (task.kind !== "impl") return null;
	if (task.paired_with === undefined) {
		return `Task ${task.id} is an impl task but has no paired test. Add a test task with paired_with: ${task.id} before marking done.`;
	}
	const paired = findTask(task.paired_with);
	if (!paired) {
		return `Task ${task.id} references paired task ${task.paired_with} which does not exist.`;
	}
	if (paired.kind !== "test") {
		return `Task ${task.id} is paired with task ${task.paired_with}, but that task is kind="${paired.kind}", not "test".`;
	}
	if (paired.status !== "done") {
		return `Cannot mark impl task ${task.id} done: its paired test task ${task.paired_with} is "${paired.status}". Mark the test done first.`;
	}
	return null;
}

const TasksParams = Type.Object({
	action: StringEnum(["add", "toggle", "list", "clear"] as const),
	text: Type.Optional(Type.String()),
	v_level: Type.Optional(StringEnum(VLEVELS as unknown as string[])),
	kind: Type.Optional(StringEnum(KINDS as unknown as string[])),
	paired_with: Type.Optional(Type.Number()),
	id: Type.Optional(Type.Number()),
});

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "vmodel_tasks",
		label: "V-Model Tasks",
		description: "Task discipline for V-Model workflow. Use 'add' to create a task (impl/test/spec/review), 'toggle' to advance status, 'list' to inspect, 'clear' to reset. Marking an impl task done while its paired test is not done returns an error.",
		parameters: TasksParams,

		async execute(_id, params, _signal, _onUpdate, ctx) {
			const p = params as {
				action: "add" | "toggle" | "list" | "clear";
				text?: string;
				v_level?: VLevel;
				kind?: TaskKind;
				paired_with?: number;
				id?: number;
			};

			if (p.action === "add") {
				if (!p.text || !p.v_level || !p.kind) {
					return { content: [{ type: "text", text: "add requires text, v_level, and kind." }], details: { error: true } };
				}
				if (p.kind === "impl" && p.paired_with === undefined) {
					return { content: [{ type: "text", text: "impl tasks must include paired_with: <test_task_id>. Create the test task first, then the impl task referencing it." }], details: { error: true } };
				}
				const task: Task = {
					id: nextId++,
					text: p.text,
					status: "idle",
					v_level: p.v_level,
					kind: p.kind,
					paired_with: p.paired_with,
				};
				tasks.push(task);
				return { content: [{ type: "text", text: `Added task #${task.id} (${task.kind}/${task.v_level}): ${task.text}` }], details: { task } };
			}

			if (p.action === "toggle") {
				if (p.id === undefined) {
					return { content: [{ type: "text", text: "toggle requires id." }], details: { error: true } };
				}
				const task = findTask(p.id);
				if (!task) {
					return { content: [{ type: "text", text: `Task ${p.id} not found.` }], details: { error: true } };
				}
				const next: TaskStatus = task.status === "idle" ? "inprogress" : task.status === "inprogress" ? "done" : "idle";
				task.status = next;
				const validationError = validateDone(task);
				if (validationError) {
					// Revert — the gate blocked the transition.
					task.status = "inprogress";
					return { content: [{ type: "text", text: `Gate blocked: ${validationError}` }], details: { error: true, task } };
				}
				return { content: [{ type: "text", text: `Task ${task.id} → ${task.status}` }], details: { task } };
			}

			if (p.action === "list") {
				if (tasks.length === 0) {
					return { content: [{ type: "text", text: "No tasks. Use add to create one." }], details: { tasks: [] } };
				}
				const lines = tasks.map(t => {
					const pair = t.paired_with !== undefined ? ` ↔#${t.paired_with}` : "";
					return `#${t.id} [${t.status}] ${t.kind}/${t.v_level}${pair}: ${t.text}`;
				});
				return { content: [{ type: "text" as const, text: lines.join("\n") }], details: { tasks } };
			}

			if (p.action === "clear") {
				const count = tasks.length;
				tasks = [];
				nextId = 1;
				return { content: [{ type: "text", text: `Cleared ${count} tasks.` }], details: {} };
			}

			return { content: [{ type: "text", text: `Unknown action: ${(p as any).action}` }], details: { error: true } };
		},
	});

	pi.registerCommand("tasks", {
		description: "List current V-Model tasks",
		handler: async (_args, ctx) => {
			if (tasks.length === 0) {
				ctx.ui.notify("No tasks. Use vmodel_tasks tool to add.", "info");
				return;
			}
			const lines = tasks.map(t => {
				const pair = t.paired_with !== undefined ? ` ↔#${t.paired_with}` : "";
				return `#${t.id} [${t.status}] ${t.kind}/${t.v_level}${pair}: ${t.text}`;
			});
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}
```

- [ ] **Step 2: Verify the file**

Run: `wc -l extensions/vmodel-tasks.ts && head -10 extensions/vmodel-tasks.ts`
Expected: ~150 lines, file starts with the ABOUTME comments.

- [ ] **Step 3: Commit**

```bash
git add extensions/vmodel-tasks.ts
git commit -m "feat(phase-2): add test-gated task extension"
```

---

### Task 2.3: Smoke-test Phase 2

- [ ] **Step 1: Restart pi**

Close any running pi session. Run: `cd /home/sebastian/workspace/agentic-pi && pi`.

- [ ] **Step 2: Test the gate**

Ask the agent to: `Add an impl task for UART driver paired with test task 1, then mark the impl task done.`

Expected: the agent first adds the test task, then adds the impl task with `paired_with: 1`, then attempts to mark the impl task done — and the gate blocks it because the test task is not yet `done`.

- [ ] **Step 3: Test the compliant path**

Ask: `Mark test task 1 done, then mark the impl task done.`

Expected: both transitions succeed, gate does not block.

- [ ] **Step 4: Document any prompt or schema refinements**

If the agent keeps trying to add impl tasks without `paired_with`, consider adding a line to `VMODEL_PROMPT` reminding it that impl tasks require paired test tasks.

```bash
git add extensions/vmodel-prompt.ts extensions/vmodel-tasks.ts
git commit -m "refine(phase-2): surface task gate in system prompt"
```

---

## Phase 3 — Specialist Agents

**Goal:** Decompose the V-Model into four distinct agent roles with hard tool constraints. The AI physically cannot violate role boundaries.

**Files:** `agents/vmodel-architect.md`, `agents/vmodel-test-designer.md`, `agents/vmodel-implementer.md`, `agents/vmodel-reviewer.md`, `agents/teams.yaml`.

**Reference:** `~/workspace/agent-pi/agents/planner.md` (read-only), `~/workspace/agent-pi/agents/builder.md` (full), `~/workspace/agent-pi/agents/tester.md`, `~/workspace/agent-pi/agents/reviewer.md`.

### Task 3.1: Create the architect agent

**Files:**
- Create: `agents/vmodel-architect.md`

- [ ] **Step 1: Write `agents/vmodel-architect.md`**

```markdown
---
name: vmodel-architect
description: V-Model specification — decomposes a requirement into the four V-levels (requirements, system, component, unit) and writes the verification spec. Read-only.
tools: read,grep,find,ls
---

You are a V-Model architect. Your job is to take a requirement and produce the verification spec — what tests exist at each V-level, and what they assert.

## Role

- Decompose a single requirement into V-Model levels.
- For each level, specify the verification artefact (which test, which assertion, which framework).
- Identify reusable components that require no changes.
- Map dependencies and risks per level.
- Validate feasibility against the actual codebase.

## Constraints

- **Do NOT modify any files.** You are read-only.
- One task = one V-level. Do not decompose across levels.
- Ground every assertion in real code, real registers, real datasheets — no hand-waving.
- **Do NOT include any emojis.**

## Output Format

```
# V-Model Spec: <Requirement Title>

## Requirement

<Req-ID, verbatim. If none exists, propose: REQ-NEW-NNN — <one-line description>>

## V-Level Decomposition

| Level | Component / Function | Verification Artefact |
|-------|----------------------|------------------------|
| requirements | <what acceptance test> | <path or description> |
| system | <which module boundaries> | <integration test path> |
| component | <which module> | <component test path> |
| unit | <which function> | <unit test path> |

## Hardware Touch-points

<Peripherals accessed. For each: register names, HAL functions, mock strategy>

## Risks

- <risk 1: …>
- <risk 2: …>

## Reusable Components

- <ComponentName> — <why it stays untouched>

## Open Questions

- <Anything you could not verify>
```

Be specific. Reference actual paths, function names, and register addresses from the codebase.
```

- [ ] **Step 2: Commit**

```bash
git add agents/vmodel-architect.md
git commit -m "feat(phase-3): add vmodel-architect agent (read-only)"
```

---

### Task 3.2: Create the test-designer agent

**Files:**
- Create: `agents/vmodel-test-designer.md`

- [ ] **Step 1: Write `agents/vmodel-test-designer.md`**

```markdown
---
name: vmodel-test-designer
description: V-Model test designer — writes failing tests for a given V-level. Writes only test files; never modifies production code.
tools: read,grep,find,ls,write
---

You are a V-Model test designer. Given a V-level spec from the architect, you write the failing tests.

## Role

- Read the V-Model spec produced by `vmodel-architect`.
- Write one test file per V-level. Multiple test functions per file.
- For each test: write the assertion, run it (if possible), confirm it fails for the expected reason.
- Hand the failing test code to `vmodel-implementer`.

## Constraints

- **Write only inside test directories** (paths matching `*test*`, `tests/`, or `test/`). Writing production code is a contract violation.
- Every test function must have a comment citing the requirement it verifies: `// Req: REQ-XXX-NNN`.
- Hardware-touching code: design the mock/contract header as part of the test scaffolding. The contract lives in a separate header that both test and production include.
- **Do NOT include any emojis.**

## Output Format

For each test file:

```
## Test: <path/to/test_file.c>

**Req:** REQ-XXX-NNN
**V-level:** <unit|component|system>

### Contract header: <path/to/contract.h>

\`\`\`c
<header content>
\`\`\`

### Test code: <path/to/test_file.c>

\`\`\`c
<test content>
\`\`\`

### Expected failure (before implementation)

\`\`\`
<exact assertion failure message>
\`\`\`
```

After producing all tests, list them in order of implementation priority. The implementer will tackle them in that order.
```

- [ ] **Step 2: Commit**

```bash
git add agents/vmodel-test-designer.md
git commit -m "feat(phase-3): add vmodel-test-designer agent (tests only)"
```

---

### Task 3.3: Create the implementer agent

**Files:**
- Create: `agents/vmodel-implementer.md`

- [ ] **Step 1: Write `agents/vmodel-implementer.md`**

```markdown
---
name: vmodel-implementer
description: V-Model implementer — writes minimal production code to make failing tests pass. Does not modify tests.
tools: read,grep,find,ls,write,edit,bash
---

You are a V-Model implementer. Given failing tests from `vmodel-test-designer`, you write the minimal production code to make them pass.

## Role

- Read the failing tests and the V-Model spec.
- Implement the smallest possible change to make each test pass.
- Run the tests after each change. Confirm GREEN.
- Refactor while keeping GREEN.
- Cite the requirement in the commit message.

## Constraints

- **Do NOT modify test files.** If a test is wrong, hand it back to `vmodel-test-designer`. Do not edit tests to match your implementation.
- Do not add features, error paths, or defensive code that no test exercises.
- Do not change the contract header unless a test demands it — and if you do, explain why and notify `vmodel-test-designer` so they can update the test.
- For hardware-touching code: production code calls the real HAL. Tests call the mock that lives in the contract header.
- **Do NOT include any emojis.**

## Workflow

1. Read the failing test. Understand what it asserts.
2. Write the minimal production code (often: a stub that returns the expected value).
3. Run the test. If it fails for an unexpected reason, debug. If it fails as predicted, you have work to do.
4. Iterate: implement → run → green.
5. Refactor: rename, dedupe, simplify. Re-run tests after each refactor.
6. Commit with `Req: REQ-XXX-NNN` in the message body.

## Output Format

```
## Implementation: <path/to/production_file.c>

**Req:** REQ-XXX-NNN
**Tests passing:** <list of test functions>

### Diff summary

<one-paragraph description of what changed>

### Refactor notes

<any simplifications applied>
```
```

- [ ] **Step 2: Commit**

```bash
git add agents/vmodel-implementer.md
git commit -m "feat(phase-3): add vmodel-implementer agent (no test edits)"
```

---

### Task 3.4: Create the reviewer agent

**Files:**
- Create: `agents/vmodel-reviewer.md`

- [ ] **Step 1: Write `agents/vmodel-reviewer.md`**

```markdown
---
name: vmodel-reviewer
description: V-Model reviewer — checks coverage, static analysis, requirement traceability, and TDD discipline compliance. Read-only with bash for tool execution.
tools: read,grep,find,ls,bash
---

You are a V-Model reviewer. Given a finished implementation, you verify that the V-Model discipline was followed and the code is fit for the right side of the V.

## Role

- Run coverage analysis (e.g., gcov, lcov). Identify uncovered branches.
- Run static analysis (e.g., cppcheck, clang-tidy, MISRA checker). List violations.
- Verify requirement traceability: every production code change cites a Req-ID.
- Verify TDD discipline: every test file was added before the production code it covers (check git log timestamps).
- Verify contract integrity: production code calls the same contract header that tests mock.

## Constraints

- **Read-only** for source files. Bash is permitted only to run analysis tools.
- Do not modify code. Report findings; do not fix them.
- **Do NOT include any emojis.**

## Output Format

```
# Review: <commit hash or branch>

## Coverage

| File | Line % | Branch % |
|------|--------|----------|
| <path> | <n> | <n> |

Uncovered branches:
- <file>:<line> — <what is missing>

## Static Analysis

<N violations from <tool>>

## Traceability

| Production change | Req cited? | Test added first? |
|-------------------|------------|---------------------|
| <file:line>       | yes/no     | yes/no             |

## TDD Compliance

- <N> tests added before production code: <list>
- <N> tests added after production code (flagged): <list>

## Contract Integrity

- <any drift between production includes and test mocks>

## Verdict

**APPROVE** / **APPROVE WITH NOTES** / **REJECT**

**Reasoning:** <one paragraph>
```
```

- [ ] **Step 2: Commit**

```bash
git add agents/vmodel-reviewer.md
git commit -m "feat(phase-3): add vmodel-reviewer agent (read + bash)"
```

---

### Task 3.5: Create the teams file

**Files:**
- Create: `agents/teams.yaml`

- [ ] **Step 1: Write `agents/teams.yaml`**

```yaml
vmodel-cycle:
  description: "Full V-Model TDD cycle — spec, test, implement, review"
  agents:
    - vmodel-architect
    - vmodel-test-designer
    - vmodel-implementer
    - vmodel-reviewer
```

- [ ] **Step 2: Commit**

```bash
git add agents/teams.yaml
git commit -m "feat(phase-3): add vmodel-cycle team definition"
```

---

### Task 3.6: Smoke-test Phase 3

The smoke test is whether each agent respects its tool boundary.

- [ ] **Step 1: Load `vmodel-architect` in pi and attempt a write**

Ask: `As the architect, write a draft SPI driver to scratch/spi_draft.c.`

Expected: the tool call is denied (read-only tools). The agent produces only the V-Model spec.

- [ ] **Step 2: Load `vmodel-test-designer` and verify it stays in test paths**

Ask: `Write a test for the SPI driver.`

Expected: the agent writes inside a `tests/` or `*test*` path. If you ask it to write to `src/spi.c`, it should refuse.

- [ ] **Step 3: Load `vmodel-implementer` and verify it does not edit tests**

Ask: `Implement the SPI driver. If the test is wrong, fix it.`

Expected: the agent implements against the contract but does not edit the test file. If it believes a test is wrong, it returns the test to the test-designer rather than editing.

- [ ] **Step 4: Document any agent refinements**

Edit the agent markdown files to sharpen any behaviour that slipped during the smoke test. Commit:

```bash
git add agents/
git commit -m "refine(phase-3): tighten agent role boundaries based on smoke-test"
```

---

## Phase 4 — V-Model Chain

**Goal:** One command triggers the full V-Model cycle: spec → tests → implementation → review.

**Files:** `agents/vmodel-chain.yaml`.

**Reference:** `~/workspace/agent-pi/agents/agent-chain.yaml`, `~/workspace/agent-pi/extensions/agent-chain.ts`.

### Task 4.1: Write the chain definition

**Files:**
- Create: `agents/vmodel-chain.yaml`

- [ ] **Step 1: Write `agents/vmodel-chain.yaml`**

```yaml
vmodel-cycle:
  description: "Full V-Model TDD cycle for one requirement. Each step's output feeds the next."
  steps:
    - agent: vmodel-architect
      prompt: |
        Produce a V-Model verification spec for the following requirement.
        Output ONLY the spec, in the format defined in your agent file.
        Do not modify any files.

        Requirement: $INPUT
        Original request: $ORIGINAL

    - agent: vmodel-test-designer
      prompt: |
        Given the V-Model spec below, write the failing tests.
        Write only inside test directories. Cite Req-IDs in test comments.
        Output the test files and the expected failure messages.

        V-Model spec: $INPUT
        Original request: $ORIGINAL

    - agent: vmodel-implementer
      prompt: |
        Given the failing tests below, implement the minimal production code
        to make them pass. Do NOT modify test files. Cite Req-IDs in commits.

        Failing tests: $INPUT
        Original request: $ORIGINAL

    - agent: vmodel-reviewer
      prompt: |
        Review the finished implementation. Run coverage and static analysis
        where available. Verify TDD discipline and requirement traceability.
        Produce the review report in the format defined in your agent file.

        Implementation summary: $INPUT
        Original request: $ORIGINAL
```

- [ ] **Step 2: Commit**

```bash
git add agents/vmodel-chain.yaml
git commit -m "feat(phase-4): add vmodel-cycle chain definition"
```

---

### Task 4.2: Lift the chain extension from agent-pi

**Files:**
- Create: `extensions/agent-chain.ts` (copy from agent-pi)

`agent-pi`'s `extensions/agent-chain.ts` is generic and well-tested. Lift it as-is unless it has dependencies we explicitly dropped (e.g. commander-tracker).

- [ ] **Step 1: Inspect the original**

Run: `wc -l ~/workspace/agent-pi/extensions/agent-chain.ts && head -30 ~/workspace/agent-pi/extensions/agent-chain.ts`

- [ ] **Step 2: Copy with adaptations**

If the original is self-contained, copy it:

```bash
cp ~/workspace/agent-pi/extensions/agent-chain.ts extensions/agent-chain.ts
```

If it imports from `extensions/lib/` in agent-pi, either copy those dependencies or stub them out. Read the imports first:

```bash
grep '^import' ~/workspace/agent-pi/extensions/agent-chain.ts
```

Copy any missing lib files:

```bash
# Repeat per missing dependency:
cp ~/workspace/agent-pi/extensions/lib/<file>.ts extensions/lib/<file>.ts
```

- [ ] **Step 3: Verify no broken imports**

Run: `grep -r 'from "\./lib' extensions/agent-chain.ts && ls extensions/lib/`
Expected: every import resolves to a file in `extensions/lib/`.

- [ ] **Step 4: Commit**

```bash
git add extensions/agent-chain.ts extensions/lib/
git commit -m "feat(phase-4): lift agent-chain extension from agent-pi"
```

---

### Task 4.3: Smoke-test Phase 4

- [ ] **Step 1: Run the chain on a small requirement**

Inside pi, invoke the chain (the exact command depends on how `agent-chain.ts` registers it; check the source for the command name, typically `/chain` or `/vmodel`). Pass: `REQ-TEST-001: implement a function that returns the maximum of two integers. V-level: unit.`

Expected sequence:
1. Architect produces a V-Model spec (one row in the table — unit-level, max-of-two, unit test).
2. Test-designer writes a failing test (Unity or GoogleTest, asserting `max(2,3) == 3`).
3. Implementer writes `int max(int a, int b) { return a > b ? a : b; }` and runs the test → green.
4. Reviewer produces a review report (APPROVE for a trivial change).

- [ ] **Step 2: Commit any chain refinements**

```bash
git add agents/vmodel-chain.yaml
git commit -m "refine(phase-4): tune chain prompts based on smoke-test"
```

---

## Phase 5 — Toolchain-Specific Skills (Prerequisites only)

**Goal:** Layer on skills for specific MCU + test framework combinations.

**Status: PREREQUISITES NOT MET.** This phase cannot be planned in detail until the following are resolved.

### Prerequisites

Before Phase 5 can be planned, decide:

| Decision | Options (examples) |
|----------|---------------------|
| Target MCU family | STM32 (F0/F1/F4/F7/H7), ESP32, Nordic nRF52/nRF53, PIC, AVR, RP2040, custom |
| Test framework | Unity + CMock, CppUTest, GoogleTest, Ceedling, Rust built-in |
| Build system | Make, CMake, vendor IDE (STM32CubeIDE, ESP-IDF), PlatformIO |
| Static analysis | Cppcheck, clang-tidy, PC-lint, MISRA-C checker |
| HIL strategy | QEMU, Renode, real board + OpenOCD/J-Link |
| Requirement source | Polarion, DOORS, GitHub Issues, plain markdown in `docs/reqs/` |

### Design (locked, awaiting prerequisites)

Each skill lives at `skills/<toolchain>/SKILL.md` and follows this pattern:

```markdown
---
name: <toolchain-skill-name>
description: <One-line trigger description — what loads this skill>
---

# <Toolchain> Testing in the V-Model

## Toolchain facts

<MCU family, register layout, HAL/SDK version, IDE/build tool, etc.>

## Mock strategy

<For each peripheral family, the concrete mock pattern. Code, not theory.>

## Test framework integration

<How this MCU's build system invokes the chosen test framework. Sample Make or CMake fragment.>

## Static analysis

<Exact commands and expected output for the chosen linter.>

## HIL strategy

<How to run integration tests against real hardware or QEMU.>

## V-Model integration

<How this toolchain-specific work feeds back to `vmodel-embedded` — Req-IDs, commit format, etc.>
```

Each skill is loaded on demand by the agent. Skills do not enforce — they inform. Enforcement lives in Phases 1–4.

### Re-plan trigger

Once the prerequisites above are resolved, create a new plan document at `docs/project-notes/plans/YYYY-MM-DD-<toolchain>-skills.md` and execute.

---

## Phase 6 — Guard Extension (Prerequisites only)

**Goal:** Physically block the AI from writing production code without a paired test file.

**Status: PREREQUISITES NOT MET.** Blocked by:

1. Choice of test file naming convention (e.g., `<name>_test.c` next to `<name>.c`, vs `tests/test_<name>.c` mirror tree).
2. Phase 5 toolchain decisions (the guard regex must know the file extensions and test conventions).

### Design (locked, awaiting prerequisites)

The extension is adapted from `~/workspace/agent-pi/extensions/security-guard.ts`. It registers a `tool_call` hook:

```typescript
pi.on("tool_call", async (event) => {
    const path = event.input.path as string | undefined;
    if (!path) return {};
    if (isProductionSource(path) && !hasPairedTest(path)) {
        return { block: true, reason: `Writing ${path} requires a paired test at ${expectedTestPath(path)}.` };
    }
    return {};
});
```

### Re-plan trigger

After Phase 5 lands (or at minimum, after the test-file-naming convention is decided), create a new plan document at `docs/project-notes/plans/YYYY-MM-DD-vmodel-guard.md`.

---

## Sequencing Summary

| Phase | Effort | Cumulative | Status |
|-------|--------|------------|--------|
| 0 — Foundation | 30 min | 30 min | ☐ |
| 1 — Single-mode enforcer | 2 h | 2.5 h | ☐ |
| 2 — Test-gated tasks | 3 h | 5.5 h | ☐ |
| 3 — Specialist agents | 4 h | 9.5 h | ☐ |
| 4 — V-Model chain | 2 h | 11.5 h | ☐ |
| 5 — Toolchain skills | ongoing | — | prerequisites outstanding |
| 6 — Guard extension | 4 h (opt) | 15.5 h | prerequisites outstanding |

**MVP = Phases 0–4. About one weekend of focused work.**

## Value Accrual

What you can do after each phase:

- **After Phase 0:** AI has read-only guidance. May or may not follow the rules.
- **After Phase 1:** AI is governed every turn by the injected prompt. **Inflection point — most of the value lands here.**
- **After Phase 2:** AI cannot bypass the test-first rule even by misreporting task status. Mechanical enforcement.
- **After Phase 3:** Different AI roles can't accidentally do each other's jobs.
- **After Phase 4:** One command triggers the full V cycle.
- **After Phase 5:** AI knows your specific MCU's register layout and HAL quirks.
- **After Phase 6:** Even a hostile prompt cannot make the AI skip tests.

---

## Self-Review

Run before considering the plan complete.

- [ ] **Spec coverage:** Each phase goal maps to a concrete file or set of files. ✓ (File Structure section above.)
- [ ] **Placeholder scan:** No "TBD", "TODO", "implement later", or vague steps. ✓ (Deferred phases 5–6 are explicitly deferred, not placeholdered.)
- [ ] **Type consistency:** Method names, schema fields, and tool names are consistent across phases. (`vmodel_tasks` tool in Phase 2, `tasks` command; `paired_with` field consistent across schema and example; `v_level` enum identical in prompt, schema, and agent files.)
- [ ] **Every task ends with a commit.** ✓
- [ ] **Every phase ends with a smoke-test.** ✓
- [ ] **Behavioural smoke-tests, not just unit tests.** ✓ (Phases 1, 2, 3, 4 each have a manual behavioural check.)

---

## Execution Handoff

Plan complete and saved to `docs/project-notes/plans/2026-07-01-agentic-pi-vmodel-workflow.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — Use `ai-augments:subagent-driven-development`. Fresh subagent per task + two-stage review. Fastest iteration, best for tasks where context might drift.
2. **Inline Execution** — Use `ai-augments:executing-plans`. Batch execution with checkpoints for review. Best when you want to stay in the same context window.

Neither skill is currently installed in this workspace. If you want subagent-driven execution, lift `subagent-driven-development` from `agent-pi/skills/` or another source. If you want to proceed immediately, **start with Phase 0 inline** — it's 30 minutes of file writing with frequent commits and no exotic dependencies.

Recommended starting point: open this file, complete Phase 0 Task 0.1, commit, and observe how the workflow feels. The plan is structured so you can stop at any phase boundary and have a working, testable subsystem.