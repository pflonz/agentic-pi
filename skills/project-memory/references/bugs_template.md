# Bug Log Template

This file demonstrates the format for logging bugs and their solutions. Keep entries brief and chronological.

## Format

Each bug entry should include:
- Date (YYYY-MM-DD)
- Brief description of the bug/issue
- Reproduction steps
- Root cause summary
- Solution or fix applied
- Any prevention notes (optional)

Use bullet lists for simplicity. Older entries can be manually removed when they become irrelevant.

## Example Entries

### YYYY-MM-DD - Brief Bug Description
- **Issue**: What went wrong
- **Reproduction**: Steps to reliably reproduce the issue
- **Root Cause**: Why it happened
- **Solution**: How it was fixed
- **Prevention**: How to avoid it in the future

### 2026-03-20 - CMake preset used for wrong workflow
- **Issue**: Build failed because a GCC CMake preset was used for a Keil-oriented workflow.
- **Reproduction**: Run `cmake --preset ccx_drive_module_minimal_debug` and expect Keil output artifacts.
- **Root Cause**: The repository supports GCC presets in `CMakePresets.json`, while Keil builds follow a different workflow.
- **Solution**: Use the GCC preset workflow only for GCC builds and keep Keil workflow separate.
- **Prevention**: Document build intent in task names and verify preset purpose before running builds.

### 2026-03-20 - Missing submodule content caused include errors
- **Issue**: Compilation failed with missing headers from shared components.
- **Reproduction**: Clone repo without recursive submodules, then run a module build.
- **Root Cause**: Required content under `submodules/` was not initialized.
- **Solution**: Run `git submodule update --recursive` before configuring/building.
- **Prevention**: Add submodule initialization to onboarding and CI bootstrap checks.

## Tips

- Keep descriptions under 2-3 lines
- Focus on what was learned, not exhaustive details
- Include enough context for future reference
- Date entries so you know how recent the issue is
- Periodically clean out very old entries (6+ months)
