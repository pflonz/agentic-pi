# Architectural Decisions Template

This file demonstrates the format for logging architectural decisions (ADRs). Use bullet lists for clarity.

## Format

Each decision should include:
- Date and ADR number
- Context (why the decision was needed)
- Decision (what was chosen)
- Alternatives considered
- Consequences (trade-offs, implications)

## Example Entries

### ADR-XXX: Decision Title (YYYY-MM-DD)

**Context:**
- Why the decision was needed
- What problem it solves

**Decision:**
- What was chosen

**Alternatives Considered:**
- Option 1 -> Why rejected
- Option 2 -> Why rejected

**Consequences:**
- Benefits
- Trade-offs

### ADR-001: Use CMake Presets as the GCC Build Entrypoint (2026-03-20)

**Context:**
- CCX supports multiple build workflows during migration from Keil to GCC.
- Developers need consistent local and CI commands for GCC-based builds.
- Preset drift creates avoidable configuration and target-selection errors.

**Decision:**
- Use CMake presets from `CMakePresets.json` as the canonical entrypoint for GCC builds.
- Use Ninja as generator through preset inheritance.
- Keep Keil workflow separate; do not treat Keil and GCC commands as interchangeable.

**Alternatives Considered:**
- Ad-hoc `cmake -D...` commands -> Rejected: inconsistent flags and poor reproducibility
- Keep primary workflow in IDE-only project files -> Rejected: weak CLI/CI portability

**Consequences:**
- ✅ Reproducible GCC builds across developer machines and CI
- ✅ Clear mapping from preset names to module/machine variants
- ✅ Easier onboarding with one documented build entrypoint
- ❌ Requires preset maintenance as matrix grows
- ❌ Developers must understand which workflows are GCC-only

### ADR-002: Keep Bootloader, Bootselector, and Application as Separate Targets (2026-03-20)

**Context:**
- CCX has DM and CM deliverables with different responsibilities and toolchains.
- Bootloader and bootselector artifacts have different constraints than application firmware.
- Mixed targets in one build path increase risk of wrong artifact generation.

**Decision:**
- Maintain separate target definitions for bootloader, bootselector, and application.
- Keep DM and CM build targets explicitly named and independently buildable.
- Use dedicated toolchain files per target type where required.

**Alternatives Considered:**
- Single monolithic firmware target -> Rejected: unclear artifact boundaries and higher release risk
- Merge bootloader and bootselector flows -> Rejected: hides lifecycle and flashing differences

**Consequences:**
- ✅ Clear artifact ownership and release boundaries
- ✅ Safer flashing and deployment workflows
- ✅ Better testability per firmware role
- ❌ More target definitions to maintain
- ❌ Longer documentation and CI matrix

### ADR-003: Centralize Common Build Logic in cmake/buildsystem (2026-03-20)

**Context:**
- The repository contains many machine/module variants with shared compiler and tooling needs.
- Duplicated configuration in target-specific files leads to drift and inconsistent behavior.
- Ongoing GCC migration requires a maintainable place for shared rules.

**Decision:**
- Keep shared compiler, analysis, docs, linker, and toolchain logic in `cmake/buildsystem`.
- Keep target-specific settings minimal and focused on machine/module differences.
- Prefer extending shared modules over copy-pasting target-local build snippets.

**Alternatives Considered:**
- Keep all logic local to each target folder -> Rejected: high duplication and fragile updates
- Move all build logic into one root CMake file -> Rejected: poor modularity and difficult ownership

**Consequences:**
- ✅ Consistent tooling behavior across CCX targets
- ✅ Lower maintenance cost for cross-cutting changes
- ✅ Better reuse for new machine/module variants
- ❌ Requires discipline to avoid local bypasses
- ❌ Refactoring legacy target files takes time

## Tips

- Number decisions sequentially (ADR-001, ADR-002, etc.)
- Always include date for context
- Be honest about trade-offs (use ✅ and ❌)
- Keep alternatives brief but clear
- Update decisions if they're revisited/changed
- Focus on "why" not "how" (implementation details go elsewhere)
