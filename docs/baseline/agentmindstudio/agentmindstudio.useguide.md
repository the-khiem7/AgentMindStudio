# AgentMindStudio — Planned User Guide and Acceptance Journeys

**Baseline date:** 2026-07-15  
**Status:** Planned behavior; no application is implemented yet.

## 1. First launch

### Intended flow

1. Launch AgentMindStudio.
2. Choose **Read-only scan** or **Standard mode**. Read-only is the safest first-run default.
3. Review the bounded locations the app will inspect.
4. Start discovery.
5. Review detected clients, configuration layers, parse warnings, and unsupported versions.
6. Add a custom path only if a known client root was not detected.

### Expected result

The dashboard shows each client as one of:

- Ready
- Detected, not configured
- Partially readable
- Unsupported or unverified version
- Permission blocked
- Not detected

The app must not change or create client files during read-only discovery.

## 2. Understand one client's layers

1. Open **Clients**.
2. Select a client.
3. Review the layer stack from managed/global to the most specific project or runtime layer.
4. Select a layer to see its path, format, ownership, writability, and reload behavior.
5. Open **Effective view** to understand which definition wins when names conflict.

Acceptance behavior:

- A shadowed artifact remains visible.
- Managed and plugin-owned layers are labeled separately from user-owned files.
- The UI explains precedence in client-native terms and plain language.

## 3. Inspect an MCP server

1. Open **Inventory > MCP Servers**.
2. Filter by client or scope.
3. Select a server.
4. Review transport, command or URL, arguments, environment dependency names, enabled status, source layer, and target compatibility.
5. Open **Raw source** only when needed; sensitive values remain redacted.

If **Test connection** is available:

1. Review the process command or network endpoint.
2. Review which environment variable names are required.
3. Confirm the test separately from editing or synchronizing.
4. Inspect sanitized connection and tool-discovery results.

## 4. Synchronize an MCP server to another client

1. From an MCP server, select **Sync to...**.
2. Choose one or more target clients and a target scope.
3. Review compatibility for each target:
   - Exact
   - Convertible
   - Partial
   - Unsupported
   - Blocked
4. Resolve name conflicts and missing secret dependencies.
5. Review the field-level dry-run and affected file paths.
6. Confirm snapshot creation and apply the plan.
7. Review post-write verification and any reload/restart guidance.

Acceptance behavior:

- No target is selected silently.
- Unsupported targets cannot be forced through the normal flow.
- The app never copies a secret value by default.
- A failed target does not leave a partially written definition.

## 5. Browse and install a skill

1. Open **Skills > Discover**.
2. Search or paste an owner/repository reference supported by skills.sh.
3. Review source identity, skill list, manifests, file trees, executable content, and warnings.
4. Choose a target client and user/global scope.
5. Review the exact `npx skills` command or selected installer backend.
6. Choose whether anonymous skills CLI telemetry is enabled or disabled.
7. Confirm installation.
8. Watch sanitized progress and final validation.

Acceptance behavior:

- Node.js/npm prerequisites are checked before confirmation.
- Content is staged and inspected before promotion to an active client directory.
- Installing content does not automatically execute bundled skill scripts.
- Cancellation or failure does not leave an untracked partial installation.

## 6. Reuse an existing skill across clients

1. Open **Inventory > Skills**.
2. Select a skill and review its portable fields and client-specific extensions.
3. Select **Add target binding**.
4. Review whether the target can reference the same directory, requires a copy, or needs conversion.
5. Confirm the plan.

The app should prefer one shared physical directory only when both clients officially support that arrangement and the user understands the ownership consequence. Otherwise it should create managed bindings with explicit provenance.

## 7. Inspect instructions and rules

1. Open **Inventory > Instructions**.
2. Filter by activation behavior: always, conditional, manual, or agent-specific.
3. Select an instruction to see source layer and precedence.
4. Choose **Compare representations** before attempting a cross-client conversion.

The UI must not imply that an `AGENTS.md`, `CLAUDE.md`, Cursor `.mdc` rule, Kiro steering file, and Kilo instruction entry are semantically identical.

## 8. Resolve external drift

When an AI client or editor changes a source file after scan:

1. AgentMindStudio marks affected items as **Changed externally**.
2. The pending plan is invalidated.
3. Select **Rescan and compare**.
4. Review the new target state.
5. Build a new plan or keep the external change.

AgentMindStudio must not overwrite a changed fingerprint with an old plan.

## 9. Roll back a change

1. Open **History**.
2. Select an operation.
3. Review original and current fingerprints plus the restore diff.
4. If the file changed externally, resolve that conflict before restore.
5. Confirm restore.
6. Review post-restore validation.

Rollback is itself an audited operation and must not delete the historical record it restores from.

## 10. Create and export a profile

1. Open **Profiles** and create a named profile.
2. Add logical assets such as MCP definitions, skills, and instructions.
3. Review which fields are portable and which remain client-specific.
4. Select **Export**.
5. Review the secret-dependency manifest and redaction report.
6. Save the versioned bundle.

Acceptance behavior:

- Export is blocked if a detected secret would be included in plain text unless the user removes or replaces it.
- Authentication state, sessions, caches, histories, and logs are never profile content.

## 11. Import a profile

1. Open **Profiles > Import**.
2. Select a bundle.
3. Review provenance, version, checksum, artifacts, secret dependencies, and target compatibility.
4. Import into staging.
5. Choose target clients and scopes.
6. Apply through the normal dry-run and transaction workflow.

Importing a bundle never writes directly into active configuration without a reviewed plan.

## 12. Error messages must answer four questions

Every actionable error should tell the user:

1. What failed?
2. What was protected or restored?
3. What caused the failure, if known?
4. What safe next action is available?

Example:

> Claude Code configuration changed after this plan was created. Nothing was written. Rescan the target and review a new plan.

Avoid exposing raw stack traces, full command environments, tokens, or configuration content in default error dialogs.

## 13. MVP acceptance journeys

### Journey A — First inventory

**Given** a Windows user with at least two supported clients configured  
**When** the user runs a read-only scan  
**Then** the app lists clients, layers, MCP servers, skills, and instructions without modifying any source.

### Journey B — Safe MCP sync

**Given** a portable MCP server in Codex and a compatible Claude Code target  
**When** the user reviews and confirms the generated plan  
**Then** the target is written, validated, auditable, and restorable without copying secret values.

### Journey C — Lossy conversion prevented

**Given** a source instruction whose activation semantics cannot be represented in Cursor  
**When** the user attempts synchronization  
**Then** the app marks it partial or unsupported and identifies the exact semantic loss before any write.

### Journey D — External edit conflict

**Given** an approved plan and a target file modified by another application  
**When** the user applies the plan  
**Then** the app blocks the stale write and asks for a rescan.

### Journey E — Skill installation

**Given** Node.js/npm are available and a valid skills.sh source is selected  
**When** the user previews, chooses a target, selects telemetry preference, and confirms  
**Then** the skill is staged, installed, validated, and added to inventory without requiring terminal use.

### Journey F — Automatic recovery

**Given** a multi-file operation that fails after its first temporary output is prepared  
**When** the transaction aborts  
**Then** active client configuration remains at the pre-operation state and the UI reports the recovery result.

## 14. Terminology shown in the UI

| Product term | User-facing explanation |
|---|---|
| Artifact | A reusable AI setup item such as an MCP server, skill, or instruction. |
| Layer | One location a client reads configuration from, with its own scope and priority. |
| Binding | How one reusable item is represented in a specific client. |
| Compatibility | How faithfully an item can be represented in a target client. |
| Dry-run | A preview of changes with no files modified. |
| Snapshot | A recoverable copy made immediately before a change. |
| Drift | A source changed outside AgentMindStudio after it was last scanned. |
| Secret dependency | The name of a required credential or environment variable, not its value. |

## 15. Safety defaults

- First launch starts in read-only scan mode.
- Raw views are redacted.
- Writes require a dry-run and confirmation.
- Marketplace installs require source and file preview.
- Telemetry choice is visible before first skills CLI execution.
- Continuous sync is off.
- Managed and unverified-version layers are not writable.
- Snapshots are enabled and cannot be disabled for normal writes in MVP.
