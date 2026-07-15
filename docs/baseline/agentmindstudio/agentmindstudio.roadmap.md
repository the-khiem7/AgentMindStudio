# AgentMindStudio — Delivery Roadmap

**Baseline date:** 2026-07-15  
**Current state:** No implementation exists; business baseline initialized.

**Authority:** This roadmap inherits product intent from the [Project Nexus](../../nexus/README.md).

## Roadmap conventions

- A phase is complete only when its exit criteria are demonstrated with fixtures and a packaged Windows build where applicable.
- “Supported” means discover, parse, validate, plan, write, re-read, and restore; reading a file alone is not write support.
- All mutating work must preserve the safety rules in the product requirements.

## Phase 0 — Decision gates and compatibility fixtures

**Goal:** Remove the decisions that could force a redesign before UI implementation.

Tasks:

- [x] Keep client configuration files authoritative; AMS writes only through explicit user operations.
- [x] Use SQLite for metadata and filesystem storage for snapshot bytes.
- [x] Preserve MCP credentials as per-client bindings; do not normalize credential differences as drift.
- [x] Wrap the official `skills` CLI behind `SkillCommandGateway`, pinned to `1.5.17`; do not depend on undocumented library imports.
- [x] Create and run an isolated repeatable compatibility spike for the pinned skills runner.
- [x] Restrict product scope to global/user configuration; do not scan or manage project layers.
- [ ] Define the adapter capability and compatibility contracts.
- [ ] Collect sanitized fixtures for Copilot, Codex, Kiro, and Kilo global configuration and each MVP artifact type.
- [x] Use a schema/capability gate for unknown client versions and block only unsafe or lossy writes.
- [x] Establish the greenfield Project Nexus above feature baseline packs.
- [x] Include Copilot CLI and Copilot VS Code as distinct MVP surfaces without expanding into project scope.
- [x] Use Google Stitch for UI exploration and shadcn/ui for maintained production components.
- [x] Keep instruction/rule support read-only in MVP.
- [ ] Threat-model filesystem writes, package installation, MCP process tests, symlinks, and exported bundles.

Exit criteria:

- Adapter interface and compatibility states are approved.
- At least one fixture exists for every named client.
- Secret and snapshot policies are documented.
- No unresolved decision can change the core storage or transaction model.

## Phase 1 — Read-only foundation

**Goal:** Deliver useful visibility without changing user configuration.

Tasks:

- [ ] Scaffold the ElectroBun application and Windows packaging.
- [ ] Explore navigation, coverage, and diff variants in Google Stitch; record accepted flows rather than treating generated output as production source.
- [ ] Initialize the production component system with shadcn/ui and implement accepted flows as owned components.
- [ ] Define platform ports for filesystem roots, process execution, credential access, and packaging so a macOS implementation can be added later.
- [ ] Implement the adapter registry and client detection service.
- [ ] Implement bounded path discovery with custom-path overrides.
- [ ] Implement parsers for JSON, JSONC, TOML, YAML/frontmatter, and Markdown.
- [ ] Build the normalized inventory for clients, layers, artifacts, and bindings.
- [ ] Add redaction and sensitive-field classification.
- [ ] Implement effective-layer and shadowing analysis.
- [ ] Build dashboard, cross-client coverage matrix, client detail, artifact list, structured detail, and redacted raw views.
- [ ] Add diagnostics export that excludes content and secret values by default.

Exit criteria:

- The app detects Copilot CLI, Copilot VS Code, Codex, Kiro, and Kilo on a Windows test matrix.
- A malformed configuration cannot crash the scan.
- Every displayed item includes source path, scope, ownership, and adapter confidence.
- Read-only mode performs no mutation, process launch, or package installation.

## Phase 2 — Safe mutation engine

**Goal:** Establish transactional writes before implementing broad synchronization.

Tasks:

- [ ] Build file fingerprints and external-change detection.
- [ ] Build snapshot creation, retention, restore preview, and restore verification.
- [ ] Build a declarative sync-plan model with field-level diffs.
- [ ] Implement endpoint/provenance identity, alias links, name collisions, and intentional-difference classifications.
- [ ] Build the source-control-style raw and semantic Diff UI.
- [ ] Implement conflict actions and lossy-conversion warnings.
- [ ] Implement distinct `AddBinding`, `UpdateBinding`, `DisableBinding`, `RemoveBinding`, `UninstallContent`, `RemoveEverywhere`, and `RestoreSnapshot` operations.
- [ ] Implement atomic replace and multi-file transaction orchestration.
- [ ] Implement post-write adapter re-read and validation.
- [ ] Build the audit history and one-click rollback workflow.
- [ ] Route the advanced Raw Config editor through the same diff, validation, snapshot, transaction, and rollback pipeline.
- [ ] Add failure-injection tests for locks, permission errors, process crashes, and partial writes.

Exit criteria:

- Every write has a snapshot and audit record.
- Injected failures leave the original configuration intact or automatically restored.
- Reapplying an applied plan yields no additional changes.

## Phase 3 — MVP client adapters

**Goal:** Prove end-to-end inventory and manual MCP/skill synchronization for Copilot CLI, Copilot VS Code, Codex, Kiro, and Kilo, with read-only instruction intelligence.

Tasks:

- [ ] Implement global/user MCP read/write adapters for both Copilot surfaces and the other three harnesses.
- [ ] Implement user-scope skill read/write adapters per supported surface capability.
- [ ] Implement read-only instruction/rule inventory, activation/precedence analysis, coverage, and semantic diff.
- [ ] Implement a coverage matrix that shows missing MCP, skill, and instruction bindings per client.
- [ ] Separate portable MCP structure from per-client credential overrides in comparison and sync plans.
- [ ] Implement enable/disable behavior where the target client supports it.
- [ ] Build source-target compatibility matrix and plain-language conversion explanations.
- [ ] Add restart/reload guidance per client.
- [ ] Verify formatting, comments, unknown-field preservation, and precedence behavior with fixtures.

Exit criteria:

- A portable MCP definition and a portable skill can be synchronized among supported target combinations through the UI without replacing target credentials by default.
- Instruction/rule sources expose no create, edit, sync, remove, conversion, or Raw Config write action in MVP.
- Unsupported fields block or warn according to the compatibility contract.
- Client-specific extensions survive round trips.
- Rollback restores the exact pre-operation state.

## Phase 4 — skills command center

**Goal:** Expose the supported `npx skills` command family through UI/UX without terminal knowledge.

Tasks:

- [ ] Detect Node.js/npm prerequisites and exact `skills@1.5.17` runner identity.
- [ ] Implement the argument-safe, timeout-bound `SkillCommandGateway` and stable failure taxonomy.
- [ ] Run mutating CLI work in isolated staging and convert verified output into a separately reviewed target plan.
- [ ] Implement skill discovery/search (`find`) and installed inventory (`list`).
- [ ] Add source/repository lookup and metadata preview for `add` and `use`.
- [ ] Fetch into a staging directory before installation.
- [ ] Inspect file list, manifest, symlinks, and executable content.
- [ ] Add target client and scope selection.
- [ ] Display the exact command and telemetry setting.
- [ ] Stream sanitized progress and expose cancellation behavior.
- [ ] Detect CLI contract changes even when the process exits zero, and expose diagnostics/issue-report actions.
- [ ] Re-scan and validate installed artifacts.
- [ ] Roll back incomplete installations.
- [ ] Implement update preview and execution (`update`).
- [ ] Implement removal preview and execution (`remove`).
- [ ] Implement skill template creation (`init`).

Exit criteria:

- A new user can find, inspect, install, list, use, update, remove, and initialize skills without opening a terminal.
- No skill script is executed merely because the package was previewed or installed.
- Failure leaves no untracked partial target directory.

## Phase 5 — Additional client adapters

**Goal:** Add clients such as Claude Code, Cursor, and Cline without changing the core domain or transaction model.

Tasks:

- [ ] Implement Claude Code global configuration, MCP, instruction, and skill adapters.
- [ ] Implement Cursor global configuration, MCP, rule, and skill adapters.
- [ ] Implement Cline global configuration, MCP, rules, and skill adapters.
- [ ] Add legacy-path migration warnings without silently moving files.
- [ ] Add per-version fixtures and compatibility tests.

Exit criteria:

- Each new adapter has documented global-scope coverage.
- Each write-capable adapter passes the full transaction and round-trip suite.
- Unsupported features are visible and do not disappear during unrelated writes.

## Phase 6 — Optional profiles and portable bundles

**Goal:** Let the user move a curated environment without transferring secrets.

Tasks:

- [ ] Validate that named profiles solve a real portability need beyond direct client-to-client operations.
- [ ] Create, rename, duplicate, and delete named profiles only if validated.
- [ ] Add logical assets and selected target bindings to profiles.
- [ ] Export versioned manifests, content, checksums, and provenance.
- [ ] Replace credentials with declared secret/environment dependencies.
- [ ] Stage and inspect imported bundles.
- [ ] Apply imports only through a normal sync plan.

Exit criteria:

- Exported bundles contain no detected secret values by default.
- An older supported bundle version migrates through an explicit, testable migration path.
- Import never directly overwrites active client configuration.

## Phase 7 — Hardening and public MVP release

**Goal:** Make the product safe to distribute beyond the development machine.

Tasks:

- [ ] Sign installers and application binaries.
- [ ] Add integrity-checked update workflow with rollback.
- [ ] Complete accessibility and keyboard-navigation review.
- [ ] Complete performance testing with large skill inventories.
- [ ] Complete external security review for process execution and file operations.
- [ ] Publish the supported-client/version matrix and known limitations.
- [ ] Add privacy-preserving crash reporting as opt-in only.

Exit criteria:

- Security review has no unresolved critical or high findings.
- Upgrade and uninstall preserve user-owned configurations.
- A documented recovery path exists for every mutating feature.

## Prioritized epics

| Priority | Epic | Business value | Main dependency |
|---|---|---|---|
| P0 | Layer-aware discovery | Makes hidden configuration understandable | Adapter registry |
| P0 | Cross-client coverage matrix | Makes missing MCP, skill, and instruction bindings explicit | Logical asset identity |
| P0 | Safe transaction and rollback | Establishes trust for all writes | Snapshot policy |
| P0 | Secret-safe inventory | Prevents accidental credential exposure | Sensitive-field model |
| P0 | Cross-client MCP and skill sync | Solves the central portability pain point | Compatibility model |
| P1 | skills.sh UI | Removes CLI friction | Safe process runner |
| P2 | Optional profiles and export/import | Makes curated setups reusable and movable | Validated user need |
| P1 | Drift detection | Shows divergence after external edits | File fingerprints/watchers |
| P2 | Hooks, agents, prompts, plugins | Broadens global customization coverage | Additional adapter contracts |
| P2 | macOS platform implementation | Expands platform reach without domain rewrite | Platform ports |
| P3 | Encrypted cloud/team sync | Enables multi-device/team use | Identity, encryption, backend |

## First next action

Create an adapter spike for Codex and Kilo using sanitized global fixtures. These two clients exercise different formats and Kilo's split configuration roots. The spike must demonstrate:

1. layer discovery,
2. normalized MCP and skill models,
3. a field-level dry-run between the two formats,
4. snapshot and rollback,
5. secret redaction,
6. preservation of unknown client-specific fields,
7. intentional per-client MCP credential overrides,
8. extensibility for Copilot and Kiro without changing the core model.

Do not start with the full settings UI; the adapter and transaction spike is the highest-risk proof.
