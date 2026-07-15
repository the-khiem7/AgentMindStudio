# AgentMindStudio — Product and Business Requirements

**Baseline date:** 2026-07-15  
**Status:** Initial business analysis for a greenfield product  
**Product form:** Windows desktop application built with ElectroBun

**Authority:** This execution baseline inherits product intent from the [Project Nexus](../../nexus/README.md).

## 1. Executive summary

AgentMindStudio is a local-first control plane for discovering, understanding, managing, and synchronizing AI-development customizations across multiple AI clients.

The product addresses four recurring problems:

1. MCP servers, skills, instructions, rules, and related settings are scattered across files and folders that are difficult to inspect safely.
2. Moving to another AI client requires rebuilding the same setup manually.
3. Each client has different schemas, precedence rules, and storage locations; even one client's global configuration can be split across several files and directories.
4. The `npx skills` command family is CLI-centric and lacks a cohesive desktop workflow for discovery, installation, listing, use, update, removal, and skill initialization.

The product must not treat synchronization as raw file copying. It must build a normalized inventory, preserve client-specific semantics through adapters, preview every change, protect secrets, and support rollback.

## 2. Product vision

> Give an AI-heavy developer one trustworthy desktop workspace to see what every AI client is using, reuse a capability across compatible clients, and safely understand or reverse every change.

### Desired business outcomes

- Reduce the time required to configure a new AI client from hours to minutes.
- Make hidden configuration layers visible and understandable.
- Prevent silent data loss, malformed configuration, and accidental secret exposure.
- Turn reusable AI capabilities into portable assets instead of client-owned files.
- Provide a safe UI for installing and managing skills without requiring the user to remember CLI syntax.

### Success metrics

The following are proposed product metrics and require validation after an MVP is usable:

- Median time from first launch to a complete inventory: under 60 seconds on a typical developer machine.
- Median time to synchronize one compatible MCP server or skill to another client: under 2 minutes.
- At least 95% of supported write operations complete atomically or restore the previous state automatically.
- Zero secret values included in exported bundles by default.
- At least 80% of discovered artifacts display their effective scope and source layer correctly in supported clients.
- At least 70% of pilot users complete a first skill installation without opening a terminal.

## 3. Confirmed business inputs

The following inputs are explicit in the product request:

- The target is a desktop application using ElectroBun.
- Windows is the initial operating environment.
- The product is intended for developers who use multiple AI clients heavily.
- MVP client targets are GitHub Copilot, Codex, Kiro, and Kilo Code. The adapter architecture must allow other clients to be added later.
- Primary asset types are MCP configuration, skills, and instructions; related client configuration layers must be discoverable.
- All supported `npx skills` operations should ultimately be available through UI/UX without requiring terminal commands.
- User-level configuration under the Windows user profile makes local discovery feasible.
- Client configuration files remain authoritative; AgentMindStudio reads them live and writes only after explicit user actions.
- AgentMindStudio manages global/user configuration only. It does not scan projects or drives for project-scoped configuration.
- A harness may expose several surfaces. Shared configuration sources are recorded when verified, but never assumed for every surface.
- Same-name MCPs with different endpoints are conflicts; differently named MCPs with the same endpoint are linkable aliases.
- The default drift workflow is a source-control-style semantic Diff UI.

## 4. Actors and personas

### Primary actor: multi-client AI developer

Uses several AI coding clients, frequently experiments with MCP servers and skills, and needs portability without manually editing JSON, JSONC, TOML, YAML, or Markdown files.

Primary jobs:

- Understand what is installed and active.
- Reuse a capability in another client.
- Install or remove a skill safely.
- Diagnose why a client does not see a configuration.
- Roll back an unsuccessful change.

### Secondary actor: skill or configuration curator

Maintains a personal or team-approved collection of reusable skills, instructions, and MCP templates.

### Future actor: team administrator

Defines approved sources, policies, and bundles. Team/enterprise policy management is not part of the initial MVP, but the domain model must distinguish managed layers from writable user layers.

## 5. Scope and authority model

AgentMindStudio's product boundary is global/user configuration for the active operating-system user. It discovers only known client roots and explicit custom global roots; it never recursively scans drives for repositories.

Within those roots, the app still distinguishes ownership:

- **Managed:** organization or machine policy; visible only when encountered through a global client root and never overwritten as user configuration.
- **User/global:** the primary readable and writable scope.
- **Runtime/session/cache/auth:** non-portable client state and not treated as managed configuration.
- **Plugin/extension-provided:** owned by another package and not edited as if it were user-authored content.

Live client files are the source of truth. SQLite metadata records what AMS observed and what operations it performed; it is not a second active copy that automatically reconciles client files.

## 6. Core domain concepts

- **Harness:** one product family, such as Codex, Kiro, Kilo, or Copilot.
- **Surface:** one concrete CLI, desktop, VS Code, or JetBrains runtime within a harness.
- **Client installation:** one detected harness/surface installation, its version, executable or extension identity, and supported capabilities.
- **Configuration layer:** a concrete source with scope, precedence, path, format, ownership, and writability.
- **Artifact:** an MCP server, skill, instruction/rule, prompt, agent, hook, or supported setting discovered from a layer.
- **Logical asset:** the client-neutral identity used to relate equivalent artifacts across clients.
- **Binding:** the representation of one logical asset in one client, including client-specific fields and credential overrides.
- **Adapter:** versioned logic that discovers, parses, validates, converts, writes, and verifies one client's artifacts.
- **Sync plan:** a dry-run description of intended changes, conversions, conflicts, warnings, and unsupported fields.
- **Snapshot:** a restorable copy and metadata record created before mutation.
- **Secret reference:** a pointer to an environment variable or secure-store entry; never a portable plain-text secret by default.

## 7. Business capability requirements

### 7.1 Client discovery and health

- **BR-DISC-001:** Detect supported clients without requiring the user to locate configuration files manually.
- **BR-DISC-002:** Discover known global configuration roots for the detected client version, including split roots such as Kilo's configuration and skill directories, without scanning projects or drives.
- **BR-DISC-003:** Show client status as detected, not installed, partially configured, unsupported version, or permission blocked.
- **BR-DISC-004:** Show which layers are active, their precedence, whether they are writable, and whether a restart/reload is required after changes.
- **BR-DISC-005:** Allow users to add a custom path without replacing built-in discovery rules.

### 7.2 Unified inventory

- **BR-INV-001:** Present artifacts in a client-neutral inventory with filters for client, type, global layer, status, and compatibility.
- **BR-INV-002:** Provide a safe structured view plus an advanced Raw Config view/editor with secret values redacted until the user explicitly reveals them.
- **BR-INV-003:** Explain the effective result when the same artifact exists in multiple layers.
- **BR-INV-004:** Detect duplicates by stable identity and semantic similarity without merging them automatically.
- **BR-INV-005:** Report malformed, inaccessible, orphaned, and shadowed configuration without modifying it.
- **BR-INV-006:** Show a cross-client coverage matrix that explicitly identifies missing bindings, for example “present in Kilo, missing in Copilot”.

- **BR-INV-007:** Show raw line differences and semantic differences in a side-by-side or unified Diff UI, including present, missing, linked alias, conflict, incompatible, and intentional override states.

### 7.3 MCP management

- **BR-MCP-001:** List MCP servers, transport, command or URL, arguments, environment-variable names, enabled state, source layer, and supported tool policy.
- **BR-MCP-002:** Create, edit, enable, disable, duplicate, and remove supported user-scope MCP definitions.
- **BR-MCP-003:** Validate schemas and executable/URL prerequisites before write.
- **BR-MCP-004:** Test an MCP connection only after showing the command, network target, and environment dependencies to the user.
- **BR-MCP-005:** Convert common MCP fields across clients while surfacing any lossy or unsupported fields.
- **BR-MCP-006:** Never display, log, export, or copy a resolved secret by default.
- **BR-MCP-007:** Treat MCP structure and credential binding as separate comparison dimensions. Per-client environment values, headers, token references, and named credential profiles are preserved unless the user explicitly replaces them.

- **BR-MCP-008:** Classify the same MCP name with different endpoint fingerprints as a name collision that cannot be auto-merged.
- **BR-MCP-009:** Relate different MCP names with the same normalized URL or launch tuple as client-specific aliases of one logical MCP after review.

### 7.4 Skill management

- **BR-SKILL-001:** Display skill metadata, source, files, target clients, scope, validation state, and whether its directory name matches its manifest name where required.
- **BR-SKILL-002:** Preview `SKILL.md` and supporting files in a readable form.
- **BR-SKILL-003:** Install, update, disable where supported, duplicate, export, and uninstall a skill with an explicit target client and scope.
- **BR-SKILL-004:** Detect when one physical skill directory can be referenced by multiple compatible clients and when a copy is required.
- **BR-SKILL-005:** Preserve client extensions while distinguishing them from portable Agent Skills fields.
- **BR-SKILL-006:** Validate path traversal, symlinks, executable scripts, and suspicious content before installation.

- **BR-SKILL-007:** Determine skill identity from provenance, manifest identity, revision, and content fingerprint rather than directory name alone.

### 7.5 Instructions and rules

- **BR-INS-001:** Inventory global/user instructions with their activation rules and precedence. Project instructions are outside MVP scope.
- **BR-INS-002:** Distinguish always-on instructions, path-conditional rules, manually invoked prompts, and agent definitions.
- **BR-INS-003:** Provide compatibility outcomes instead of promising direct conversion when semantics differ.
- **BR-INS-004:** Preserve original source and client-specific metadata when a converted representation is generated.

### 7.6 Cross-client synchronization

- **BR-SYNC-001:** Let the user select a source artifact and one or more target clients in global/user scope.
- **BR-SYNC-002:** Generate a dry-run plan before any write.
- **BR-SYNC-003:** Classify each target as exact, convertible, partial, unsupported, or blocked.
- **BR-SYNC-004:** Show field-level differences and describe semantic changes in plain language.
- **BR-SYNC-005:** Support conflict actions: keep target, overwrite target, create renamed copy, merge supported fields, or skip.
- **BR-SYNC-006:** Snapshot all affected files and folders before mutation.
- **BR-SYNC-007:** Execute a multi-file change transactionally where possible; otherwise restore the snapshot on failure.
- **BR-SYNC-008:** Re-read and re-validate the target through its adapter after write.
- **BR-SYNC-009:** Maintain an audit record that can drive rollback without storing secrets or treating intentional per-client credential differences as repairable drift.
- **BR-SYNC-010:** Default to one-time synchronization. Automatic continuous synchronization is a later capability because it introduces ownership and loop conflicts.

### 7.7 Skills command center and CLI bridge

- **BR-MKT-001:** Search or accept a skills.sh source and show source, files, and risk indicators before installation or one-time use.
- **BR-MKT-002:** Represent supported `npx skills` commands as UI workflows, including `find`, `list`, `add`, `use`, `update`, `remove`, and `init`.
- **BR-MKT-003:** Generate and execute the appropriate operation through an argument-safe process runner or a future compatible programmatic backend.
- **BR-MKT-004:** Show the exact command, working directory, destination, progress, exit code, and sanitized output.
- **BR-MKT-005:** Allow telemetry opt-out and show the current telemetry choice before first use.
- **BR-MKT-006:** Never install, update, or remove silently; require confirmation after preview and target selection.
- **BR-MKT-007:** Detect Node.js/npm availability and provide an actionable prerequisite message when unavailable.

- **BR-MKT-008:** Pin the skills runner version in product source and require an isolated compatibility spike before changing it.
- **BR-MKT-009:** Convert spawn, timeout, network, version, parse, and contract errors into stable UI error states with retry, diagnostics, issue-report copy, and cancel actions.
- **BR-MKT-010:** Never trust process exit code alone; verify expected output shapes and resulting filesystem state.

### 7.8 Backup, restore, and audit

- **BR-SAFE-001:** Create immutable local snapshots before every write operation.
- **BR-SAFE-002:** Provide restore preview, restore execution, and post-restore verification.
- **BR-SAFE-003:** Record timestamp, user action, adapter version, affected paths, hashes, result, and warnings.
- **BR-SAFE-004:** Define retention by count and age; never remove the last known-good snapshot automatically.
- **BR-SAFE-005:** Offer a read-only mode that performs discovery and analysis without any write capability.

### 7.9 Optional portability profiles after MVP

- **BR-PORT-001:** Allow the user to group logical assets into optional named collections such as “Core Dev”, “Frontend”, or “AWS”; a profile is a reusable selection, not an authoritative configuration mirror.
- **BR-PORT-002:** Export a manifest and portable artifact content with secrets replaced by declared dependencies.
- **BR-PORT-003:** Import into a staging area, validate compatibility, and require a sync plan before applying.
- **BR-PORT-004:** Include version and provenance metadata so future adapters can migrate older bundles.

## 8. Business rules

1. Discovery is non-destructive.
2. No write occurs without a dry-run and explicit confirmation in MVP.
3. A client adapter may write only to paths it positively identifies and owns.
4. Managed, runtime, cache, authentication, session, and history data are not portable user configuration.
5. Unknown fields are preserved whenever the serializer can do so safely; otherwise the operation is blocked or marked lossy.
6. Secret names may be portable; secret values and credential bindings are client-specific by default.
7. Source formatting and comments should be preserved when supported, especially for JSONC and TOML.
8. Every mutation must produce a verifiable result or a recoverable failure.
9. Client version and adapter version are part of compatibility decisions.
10. One logical asset can have multiple client bindings with different credentials; no file path or credential value is the permanent identity of an asset.
11. Removing one binding does not delete shared physical content; uninstalling content requires a separate reference check and confirmation.
12. A same-name/different-endpoint conflict is never resolved automatically, and a different-name/same-endpoint alias is never linked without review.

## 9. Non-functional requirements

### Security and privacy

- Local-first operation; no account or cloud backend is required for MVP.
- Least-privilege filesystem access and explicit path boundaries.
- Redaction in UI, logs, diagnostics, exports, and crash reports.
- Process execution without shell interpolation where possible; commands and arguments remain separate.
- Source trust indicators for marketplace content and executable skill scripts.
- Windows signing and update integrity are required before general public distribution, but may be deferred for private MVP builds.

### Reliability

- Atomic file replacement where supported.
- File locking and external-change detection before commit.
- Crash-safe operation log and snapshot metadata.
- Idempotent sync plans: reapplying an already applied plan should result in no change.

### Performance

- Initial scan should remain responsive and cancellable.
- File watchers must debounce changes and avoid sync loops.
- Large skill folders should load metadata first and content on demand.

### Usability and accessibility

- Plain-language labels alongside client-native terminology.
- Diff, warning, and compatibility states must not rely on color alone.
- Keyboard navigation and screen-reader-friendly controls.
- Advanced raw editing is separated from guided forms and carries stronger warnings.

### Maintainability

- Versioned adapter contract with fixtures for every supported client and config layer.
- Parsers and serializers isolated from UI code.
- Compatibility rules are data-driven where practical.
- No client path or schema is treated as permanent.
- Platform-specific filesystem, process, credential, and packaging behavior is isolated so macOS support can be added later without replacing the domain or adapter model.

## 10. Proposed MVP boundary

### In MVP

- Windows, single local user, local-only data, with platform ports designed for later macOS support.
- Global/user configuration only; no project or drive scanning.
- Detection, inventory, comparison, and safe global writes for GitHub Copilot, Codex, Kiro, and Kilo Code.
- Artifact types: MCP servers, Agent Skills, and instructions/rules.
- One-time cross-client sync with dry-run, conflict handling, snapshot, verification, and rollback.
- UI workflows for the supported `npx skills` command family, starting with inventory, discovery, install, update, remove, one-time use, and initialization.
- Structured editor for common fields plus an advanced Raw Config editor routed through validation and rollback safeguards.
- Local metadata and audit history. Named portability profiles are post-MVP unless user testing shows they are required earlier.

### After MVP

- Additional adapters such as Claude Code, Cursor, and Cline.
- Hooks, agents, prompts, plugins, model/provider settings, and permissions.
- Optional encrypted cloud or Git synchronization.
- Team policy, approved catalogs, and managed deployment.
- macOS support, followed by Linux only if demanded.
- Automatic synchronization for explicitly selected clients and assets.

### Explicit non-goals for MVP

- Acting as an AI chat client or model router.
- Synchronizing authentication sessions, API keys, conversation history, caches, or telemetry data.
- Scanning or managing project-scoped AI configuration.
- Editing enterprise-managed policy.
- Guaranteeing that every client feature has an equivalent in another client.
- Automatically running scripts bundled in downloaded skills.
- Replacing each client's native settings UI for unrelated preferences.

## 11. Compatibility evidence informing the requirements

Official documentation reviewed on 2026-07-15 confirms the need for an adapter and layered-scope model:

- Codex uses `CODEX_HOME` (default `~/.codex`), global and project `config.toml`, global/repo instruction and skill locations, and MCP tables in TOML. See [Codex configuration](https://developers.openai.com/codex/config-basic), [skills](https://developers.openai.com/codex/skills), and [MCP](https://developers.openai.com/codex/mcp).
- Claude Code separates hierarchical settings, `~/.claude.json`, project `.mcp.json`, `CLAUDE.md`, and personal/project skills. See [Claude Code settings](https://code.claude.com/docs/en/settings), [MCP](https://code.claude.com/docs/en/mcp), and [skills](https://code.claude.com/docs/en/slash-commands).
- Cursor supports global and project MCP files and distinct global/project rule semantics. See [Cursor MCP](https://docs.cursor.com/context/model-context-protocol) and [rules](https://docs.cursor.com/context/rules).
- Kiro defines global, project, and agent scopes with different precedence. See [Kiro CLI configuration](https://kiro.dev/docs/cli/chat/configuration/).
- Kilo stores core global JSONC under `~/.config/kilo/` while global skills may live under `~/.kilo/skills/`. See [Kilo settings](https://kilo.ai/docs/getting-started/settings) and [skills](https://kilo.ai/docs/customize/skills).
- Cline separates `~/.cline/data/settings/` from global rules, skills, and compatibility paths. See [Cline configuration](https://docs.cline.bot/getting-started/config) and [skills](https://docs.cline.bot/customization/skills).
- GitHub Copilot CLI uses a user configuration directory containing settings, MCP configuration, instructions, and skills. See [Copilot CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference).
- skills.sh documents `npx skills add` as its primary installation path and notes anonymous telemetry with an opt-out environment variable. See [skills CLI reference](https://www.skills.sh/docs/cli).

## 12. Product risks

- Client schemas and paths change quickly, so an unversioned adapter can corrupt configuration.
- Some formats support comments and ordering; naive serialization damages user-maintained files even when values remain valid.
- MCP definitions commonly reference secrets and executable commands, creating both leakage and supply-chain risk.
- Semantic mismatch can create a false promise of portability.
- Multiple apps may modify the same file while AgentMindStudio is open.
- Structural comparison can be mistaken for credential equality; the product must preserve intentional per-client MCP credential bindings.
- Marketplace installation can execute package-manager lifecycle behavior and must be treated as code acquisition, not simple content download.

## 13. Recommended product position

AgentMindStudio should be positioned as a **safe local configuration control plane**, not as a universal converter. Its differentiator is trustworthy visibility and controlled portability:

- see every layer,
- understand effective behavior,
- preview compatibility,
- apply intentionally,
- recover confidently.
