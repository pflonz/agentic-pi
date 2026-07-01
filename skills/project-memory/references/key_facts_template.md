# Key Facts Template

This file demonstrates the format for storing project constants, configuration, and frequently-needed **non-sensitive** information during development and debugging. Organize by category using bullet lists.

## ⚠️ SECURITY WARNING: What NOT to Store Here

**NEVER store passwords, API keys, or sensitive credentials in this file.** This file is typically committed to version control and should only contain non-sensitive reference information.

**❌ NEVER store:**
- Passwords or passphrases
- API keys or authentication tokens
- Service account JSON keys or credentials
- Database passwords
- OAuth client secrets
- Private keys or certificates
- Session tokens
- Any secret values from environment variables
- Full connection strings that include credentials
- Internal-only endpoints that are classified or restricted
- Personal data (PII)

**✅ SAFE to store:**
- Database hostnames, ports, and cluster names
- Client names and project identifiers
- JIRA project keys and Confluence space names
- AWS/GCP account names and profile names
- API endpoint URLs (public URLs only)
- Service account email addresses (not the keys!)
- Docker registry names
- Environment names and deployment targets
- Secret reference names (for example: VAULT_PATH, SECRET_NAME)
- Public hostnames without credentials
- Port numbers
- Service names
- Links to internal secret-management documentation

**Where to store secrets (examples for this project):**
- `.env` files (excluded via `.gitignore`) - local development secrets
- `.env.ci` or CI/CD system variables (GitHub Actions, Jenkins) - build secrets
- Hardware-specific keys/firmware (store securely, not in repo)
- Team password manager (1Password, Bitwarden, etc.) - shared team credentials
- Keep sensitive hardware info (private keys, device tokens) offline or in secure vault

## Update Rules

- Keep entries short and factual.
- Add a Last Verified date for each section.
- Prefer links to source-of-truth files over duplicated details.
- Record only non-sensitive information.

## CCX Project

- Project: CCX Machines
- Purpose: Codebase for Compact Control eXtended hardware modules and software components.
- Main module types:
    - Drive Module (DM)
    - Control Module (CM)
    - Drive Module (DM)
    - Control Module (CM)
- Last Verified: YYYY-MM-DD
- Source:
    - readme.md
    - readme.md

## Build System Facts

- Primary build system: CMake + Ninja
- CMake minimum version: see top-level CMakeLists.txt (cmake_minimum_required)
- GCC build presets are defined in CMakePresets.json.
- Keil builds do not use CMake presets from this repository.
- Last Verified: YYYY-MM-DD
- Source:
    - CMakePresets.json
    - readme.md

## Common Build Presets

- Drive Module:
    - ccx_drive_module_minimal_debug
    - ccx_drive_module_minimal_release
    - ccx_drive_module_bootloader_debug
    - ccx_drive_module_bootselector_debug
- Control Module:
    - ccx_control_module_minimal_debug
    - ccx_control_module_minimal_release
    - ccx_control_module_bootloader_debug
    - ccx_control_module_bootselector_debug
- Last Verified: YYYY-MM-DD
- Source:
    - CMakePresets.json

## Common Build Commands

- Build DM minimal target:
    - cmake --preset ccx_drive_module_minimal_debug && cmake --build ./build-ccx_drive_module_minimal_debug --target drive_module_minimal
- Build CM minimal target:
    - cmake --preset ccx_control_module_minimal_debug && cmake --build ./build-ccx_control_module_minimal_debug --target control_module_minimal
- Last Verified: YYYY-MM-DD
- Source:
    - .vscode/tasks.json or workspace task definitions
    - build_all_components.sh

## CommonSource (common_src) Facts

- Location: common_src/ directory (shared firmware code)
- Changelog: docs/common-src/changelog.md (tracks all common changes)
- Ticket format: CCN-xxxxx (common component tickets)
- Key modules: BatteryManagement, MotorControl, SafeInput, CANopen
- Last Verified: YYYY-MM-DD
- Source:
	- docs/common-src/changelog.md

## AKSW Integration Facts

- Purpose: AKSW provides lower-level C/C++ library (clib) and cross-platform functionality
- Key repos: ak_aksw, ak_aksw_clib
- Integration: CCX firmware links against AKSW/AKSW_CLIB
- Typical deps: exception handlers, scheduler, CAN driver
- Branch strategy: AKSW on dev branch for development work
- Last Verified: YYYY-MM-DD
- Source:
    - Related Repositories section
    - Documentation in dependencies/ or submodules/

## Local Development Facts

- Workspace structure: .devcontainer/ for Docker setup, .vscode/ for IDE config
- Python tooling: Located in python/ directory
- Build artifacts: Generated in build-<preset>/ directories
- Dev container OS: Ubuntu 24.04.4 LTS
- Typical workflow: Configure via CMakePresets.json, build via cmake/ninja, debug via GDB
- Last Verified: YYYY-MM-DD
- Source:
	- .devcontainer/
	- docs/getting-started/environment-setup.md

## Unit Tests/Testing Facts

- Testing framework: GoogleTest (gtest/gmock)
- Test discovery: CMake integration with CTest
- Coverage tooling: gcovr (configured in gcovr.cfg)
- Coverage reports: Generate via --coverage build flags
- Test organization: Unit tests typically in unit_tests/ subdirectories
- CI integration: Tests run in Jenkins pipeline
- Last Verified: YYYY-MM-DD
- Source:
    - gcovr.cfg
    - .github/instructions/gtest_gmock_unit_testing.instructions.md
    - .github/instructions/unittest_coverage_requirement.instructions.md

## Repository Structure Facts

- ci: Jenkins and CI-related files
- cmake: Shared CMake modules and buildsystem
- common_src: Shared firmware code (tracked separately via changelog)
- doc: Project documentation and setup guides
- submodules: Shared component repositories (AKSW, CommonSource, etc.)
- target: Machine-specific target implementations
- tools: Scripts and support tooling
- python: Python build/analysis tools
- Last Verified: YYYY-MM-DD
- Source:
    - readme.md

## Development Environment Facts

- Recommended setup: Dev Container on WSL2 (see setup guide).
- Setup guide location: docs/getting-started/environment-setup.md
- GCC migration status: codebase is in transition from Keil to GCC.
- Last Verified: YYYY-MM-DD
- Source:
    - readme.md

## Quality and Tooling Facts

- Formatting: clang-format
- Static analysis: clang-tidy, cppcheck
- Coverage tooling: gcovr
- Docs tooling: Doxygen via CMake buildsystem
- Last Verified: YYYY-MM-DD
- Source:
    - readme.md
    - gcovr.cfg

## Related Repositories

- karcher-electronics/ak_aksw (default branch: dev)
- karcher-electronics/fc_ccx_machines (default branch: dev)
- karcher-electronics/ak_aksw_clib (default branch: dev)
- karcher-electronics/ak_comm_diag (default branch: dev)
- karcher-electronics/ak_seop_karcher_min_protocol (default branch: develop)
- karcher-electronics/seop-original-googletest (default branch: master)
- karcher-electronics/seop-original-min-protocol (default branch: master)
- karcher-electronics/fc_ksip (default branch: master)
- karcher-electronics/ak_third_party (default branch: master)
- karcher-electronics/ak_parasoft_cpptest (default branch: master)
- Last Verified: YYYY-MM-DD

## Project URLs

- Ticket system base URL: https://taskbox.karcher.com
- Project docs root (repo): docs/
- Last Verified: YYYY-MM-DD

## Entry Template

Use this mini-template for new sections:

### Section Name

- Fact: <short statement>
- Fact: <short statement>
- Last Verified: YYYY-MM-DD
- Source:
    - <path-or-url>

## Tips

- Keep entries current (update when things change)
- Remove deprecated information after migration is complete
- Include both production and development details
- Add URLs to make navigation easier
- Use consistent formatting (same structure for similar items)
- Group related information together
- Mark deprecated items clearly with dates
