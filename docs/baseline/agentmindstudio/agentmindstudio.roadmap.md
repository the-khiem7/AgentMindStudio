# AgentMindStudio — Delivery Roadmap

**Baseline date:** 2026-07-15  
**Current state:** No implementation exists; business baseline initialized.

## Roadmap conventions

- A phase is complete only when its exit criteria are demonstrated with fixtures and a packaged Windows build where applicable.
- “Supported” means discover, parse, validate, plan, write, re-read, and restore; reading a file alone is not write support.
- All mutating work must preserve the safety rules in the product requirements.

## Phase 0 — Decision gates and compatibility fixtures

**Goal:** Remove the decisions that could force a redesign before UI implementation.

Tasks:

- [ ] Decide whether the logical asset store is authoritative, advisory, or profile-only.
- [ ] Decide the local metadata store and snapshot retention policy.
- [ ] Decide how secrets are referenced on Windows for MVP.
- [ ] Decide whether `npx skills` is invoked directly or its open-source library is embedded behind a stable internal interface.
- [ ] Decide whether project layers are read-only or writable in the first public MVP.
- [ ] Define the adapter capability and compatibility contracts.
- [ ] Collect sanitized fixtures for each supported client, scope, and artifact type.
- [ ] Define a client/version support policy and unsupported-version UX.
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
- [ ] Implement the adapter registry and client detection service.
- [ ] Implement bounded path discovery with custom-path overrides.
- [ ] Implement parsers for JSON, JSONC, TOML, YAML/frontmatter, and Markdown.
- [ ] Build the normalized inventory for clients, layers, artifacts, and bindings.
- [ ] Add redaction and sensitive-field classification.
- [ ] Implement effective-layer and shadowing analysis.
- [ ] Build dashboard, client detail, artifact list, structured detail, and redacted raw views.
- [ ] Add diagnostics export that excludes content and secret values by default.

Exit criteria:

- The app detects the installed named clients on a Windows test matrix.
- A malformed configuration cannot crash the scan.
- Every displayed item includes source path, scope, ownership, and adapter confidence.
- Read-only mode performs no mutation, process launch, or package installation.

## Phase 2 — Safe mutation engine

**Goal:** Establish transactional writes before implementing broad synchronization.

Tasks:

- [ ] Build file fingerprints and external-change detection.
- [ ] Build snapshot creation, retention, restore preview, and restore verification.
- [ ] Build a declarative sync-plan model with field-level diffs.
- [ ] Implement conflict actions and lossy-conversion warnings.
- [ ] Implement atomic replace and multi-file transaction orchestration.
- [ ] Implement post-write adapter re-read and validation.
- [ ] Build the audit history and one-click rollback workflow.
- [ ] Add failure-injection tests for locks, permission errors, process crashes, and partial writes.

Exit criteria:

- Every write has a snapshot and audit record.
- Injected failures leave the original configuration intact or automatically restored.
- Reapplying an applied plan yields no additional changes.

## Phase 3 — First vertical adapter cohort

**Goal:** Prove end-to-end synchronization for Codex, Claude Code, and Cursor.

Tasks:

- [ ] Implement user-scope MCP read/write adapters for the three clients.
- [ ] Implement user-scope skill read/write adapters.
- [ ] Implement instruction/rule inventory and only the conversions marked safe.
- [ ] Implement enable/disable behavior where the target client supports it.
- [ ] Build source-target compatibility matrix and plain-language conversion explanations.
- [ ] Add restart/reload guidance per client.
- [ ] Verify formatting, comments, unknown-field preservation, and precedence behavior with fixtures.

Exit criteria:

- A portable MCP definition and a portable skill can be synchronized among all three clients through the UI.
- Unsupported fields block or warn according to the compatibility contract.
- Client-specific extensions survive round trips.
- Rollback restores the exact pre-operation state.

## Phase 4 — skills.sh desktop workflow

**Goal:** Make skill acquisition safe and accessible without terminal knowledge.

Tasks:

- [ ] Detect Node.js, npm, and `npx` prerequisites.
- [ ] Add source/repository lookup and metadata preview.
- [ ] Fetch into a staging directory before installation.
- [ ] Inspect file list, manifest, symlinks, and executable content.
- [ ] Add target client and scope selection.
- [ ] Display the exact command and telemetry setting.
- [ ] Stream sanitized progress and expose cancellation behavior.
- [ ] Re-scan and validate installed artifacts.
- [ ] Roll back incomplete installations.

Exit criteria:

- A new user can preview and install a public skill without opening a terminal.
- No skill script is executed merely because the package was previewed or installed.
- Failure leaves no untracked partial target directory.

## Phase 5 — Remaining client adapters

**Goal:** Expand supported writes to Kiro, Kilo Code, Cline, and GitHub Copilot.

Tasks:

- [ ] Implement Kiro global/project/agent scope inventory and supported global writes.
- [ ] Implement Kilo split-root discovery and JSONC/skill adapters.
- [ ] Implement Cline configuration, MCP, rules, and skill adapters.
- [ ] Implement Copilot CLI configuration, instruction, MCP, and skill adapters.
- [ ] Add legacy-path migration warnings without silently moving files.
- [ ] Add per-version fixtures and compatibility tests.

Exit criteria:

- All seven named clients have documented read coverage.
- Each write-capable adapter passes the full transaction and round-trip suite.
- Unsupported features are visible and do not disappear during unrelated writes.

## Phase 6 — Profiles and portable bundles

**Goal:** Let the user move a curated environment without transferring secrets.

Tasks:

- [ ] Create, rename, duplicate, and delete named profiles.
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
| P0 | Safe transaction and rollback | Establishes trust for all writes | Snapshot policy |
| P0 | Secret-safe inventory | Prevents accidental credential exposure | Sensitive-field model |
| P0 | Cross-client MCP and skill sync | Solves the central portability pain point | Compatibility model |
| P1 | skills.sh UI | Removes CLI friction | Safe process runner |
| P1 | Profiles and export/import | Makes setups reusable and movable | Logical asset identity |
| P1 | Drift detection | Shows divergence after external edits | File fingerprints/watchers |
| P2 | Project-scope sync | Supports team/repository workflows | Git and scope policy |
| P2 | Hooks, agents, prompts, plugins | Broadens customization coverage | Additional adapter contracts |
| P3 | Encrypted cloud/team sync | Enables multi-device/team use | Identity, encryption, backend |

## First next action

Create an adapter spike for Codex and Claude Code using sanitized fixtures. The spike must demonstrate:

1. layer discovery,
2. normalized MCP and skill models,
3. a field-level dry-run between the two formats,
4. snapshot and rollback,
5. secret redaction,
6. preservation of unknown client-specific fields.

Do not start with the full settings UI; the adapter and transaction spike is the highest-risk proof.
