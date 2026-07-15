# AgentMindStudio — Proposed Technical Baseline

**Baseline date:** 2026-07-15  
**Application implemented state:** None. The repository contains Nexus, baseline, and spike evidence, including the passed TG-001 ElectroBun foundation prototype, but no production application source. Everything below remains proposed rather than implemented.

**Authority:** This technical baseline inherits product intent from the [Project Nexus](../../nexus/README.md).

**Implementation readiness:** Gate status and evidence are owned by [agentmindstudio.technical-gates.md](agentmindstudio.technical-gates.md). TG-001 permits the ElectroBun scaffold and Windows platform-port commitment with its documented limitations; every component below remains proposed until its own required gates pass and production code/tests exist.

## 1. Architecture objective

Keep client-specific knowledge at the boundary. The core application should reason about normalized assets, scopes, compatibility, plans, and transactions without knowing whether the target file is JSONC, TOML, YAML, Markdown, or a directory tree.

```mermaid
flowchart LR
    UI["ElectroBun UI"] --> APP["Application services"]
    APP --> INV["Inventory service"]
    APP --> PLAN["Sync planner"]
    APP --> SAFE["Transaction and snapshot service"]
    APP --> INSTALL["Skill command gateway"]
    INV --> REG["Adapter registry"]
    PLAN --> REG
    SAFE --> REG
    REG --> COPILOT["Copilot adapter"]
    REG --> CODEX["Codex adapter"]
    REG --> KIRO["Kiro adapter"]
    REG --> KILO["Kilo adapter"]
    REG --> FUTURE["Future client adapters"]
    COPILOT --> FS["Bounded platform filesystem and process ports"]
    CODEX --> FS
    KIRO --> FS
    KILO --> FS
    FUTURE --> FS
    SAFE --> META["Local metadata and snapshots"]
    INSTALL --> FS
```

## 2. Proposed component boundaries

### Desktop shell and UI

Responsibilities:

- Window lifecycle, navigation, native dialogs, and update UI.
- Dashboard, inventory, client detail, diff, sync plan, history, restore, and settings screens.
- Use Google Stitch artifacts only to explore and approve flows; implement maintained production UI as owned shadcn/ui-based components.
- Expose instruction/rule inventory and diff as read-only views in MVP, with no mutation action or Raw Config write path.
- No direct filesystem mutation from presentation components.

### Application services

Responsibilities:

- Orchestrate use cases and authorization prompts.
- Convert adapter outputs into UI view models.
- Enforce read-only mode and confirmation requirements.

### Adapter registry

Responsibilities:

- Select an adapter by client identity and version.
- Declare read/write capabilities per artifact type and scope.
- Expose verification range and migration rules.
- Block writes when the adapter cannot safely parse, preserve, validate, or round-trip the observed configuration shape.
- Declare harness surfaces and the resolved config sources consumed by each surface; deduplicate identical resolved paths without collapsing surface capabilities.
- Register Copilot CLI and Copilot VS Code as distinct MVP surfaces with separate user/global sources and capability matrices.

### Platform ports

Responsibilities:

- Resolve global configuration roots without leaking Windows path assumptions into the domain.
- Provide argument-safe process execution, filesystem locking, atomic replacement, and optional credential-store access.
- Implement Windows first while keeping contracts implementable for macOS later.
- Never provide a recursive drive or project scanner.

### Inventory service

Responsibilities:

- Detect installations and configuration roots.
- Parse layers without mutating them.
- Normalize artifacts and compute logical identity candidates.
- Report shadowing, malformed sources, duplicate bindings, and unsupported fields.
- Build a cross-client coverage matrix that distinguishes missing artifacts from intentionally different client bindings.

### Sync planner

Responsibilities:

- Compare one logical asset with target bindings.
- Ask adapters for conversions and validation.
- Produce field-level operations, warnings, conflicts, and restart requirements.
- Produce no side effects.
- Preserve target credential overrides unless the user explicitly selects a credential replacement operation.

### Transaction and snapshot service

Responsibilities:

- Re-check fingerprints immediately before write.
- Acquire locks where possible.
- Snapshot every affected source.
- Write temporary outputs, validate, and atomically replace.
- Re-read through adapters and restore on failure.

### Skill command gateway

Responsibilities:

- Map UI workflows to supported `find`, `list`, `add`, `use`, `update`, `remove`, and `init` operations.
- Resolve source metadata.
- Stage downloads outside active client directories.
- Inspect content and risks.
- Invoke `skills@1.5.17` with `npm exec --yes --package=skills@1.5.17 -- skills ...` through a stable interface without coupling the UI to CLI text output.
- Verify exact binary version, output shape, and resulting filesystem state; exit code alone is not a success signal.
- Isolate staging `HOME`, `USERPROFILE`, `CODEX_HOME`, working directory, and npm cache for mutating CLI operations.
- Map timeouts, spawn failures, version mismatch, network errors, unparsable output, contract change, and unexpected writes to stable domain errors.
- Promote verified content to the selected destination transactionally.

### Metadata and snapshot store

Proposed split:

- SQLite for client records, logical identities, bindings, file fingerprints, compatibility observations, plans, operation history, and optional profile membership.
- Filesystem snapshot directory for original bytes and directory archives.
- Secret values excluded from both unless a future dedicated secure-store feature is approved.

SQLite is not a CRUD mirror of client configuration. Live client files remain authoritative:

- **Metadata** records where an artifact was observed, which adapter read it, its hash, client coverage, and last validation result.
- **Audit** records an explicit AMS operation, affected paths, before/after hashes, outcome, and snapshot link so the operation can be explained or reversed.
- **Profile data** is an optional post-MVP named selection of logical assets for reuse; it does not automatically enforce values onto clients.
- **Relationship data** records aliases, provenance, bindings, intentional differences, and shared-content references that cannot be reconstructed reliably from current file bytes alone.
- **Operation state** records planned, snapshotted, applying, verified, restored, and failed transitions so a crash can be diagnosed and recovered.

## 3. Proposed adapter contract

This section is design input to TG-002, not an approved implementation contract. TG-002 must produce the ADR, versioned TypeScript interface, capability schema, and proof adapters before client-specific adapter implementation begins.

An adapter should provide behavior equivalent to:

```text
identity(): ClientDescriptor
detect(context): ClientInstallation[]
discoverLayers(installation): ConfigLayer[]
capabilities(version): CapabilityMatrix
readLayer(layer): ParsedLayer
normalize(parsedLayer): Artifact[]
compare(logicalAsset, target): CompatibilityResult
planWrite(logicalAsset, target, choices): PlannedChange[]
render(plannedChanges, originalBytes): RenderedOutput
validate(renderedOutput, target): ValidationResult
postWriteCheck(target): VerificationResult
reloadGuidance(target): ReloadInstruction
```

Required guarantees:

- `readLayer`, `normalize`, `compare`, and `planWrite` are side-effect free.
- `render` preserves unknown fields and source formatting when the parser supports it.
- Every write capability is explicit by artifact type, scope, and client version.
- Adapter errors are structured; raw secret-bearing source is not included in generic logs.

## 4. Proposed normalized model

This conceptual model is input to TG-005. It does not become the SQLite schema until the schema ADR, migration `0001`, and migration/recovery tests pass.

### ClientInstallation

- `id`
- `clientKind`
- `harnessKind`
- `surfaceKind`
- `displayName`
- `version`
- `versionSource`
- `installationPath`
- `status`
- `adapterId`
- `adapterVerificationRange`

### ConfigLayer

- `id`
- `clientInstallationId`
- `scope`: managed, user, runtime, plugin
- `artifactKinds`
- `path`
- `format`
- `precedence`
- `writable`
- `ownership`
- `fingerprint`
- `parseStatus`

### LogicalAsset

- `id`
- `kind`: mcp-server, skill, instruction
- `canonicalName`
- `identityFingerprint`: endpoint evidence for MCP or provenance/content evidence for skills and instructions
- `aliases`
- `portableFields`
- `clientExtensions`
- `provenance`
- `profileMembership`

### ArtifactBinding

- `logicalAssetId`
- `clientInstallationId`
- `configLayerId`
- `nativeIdentity`
- `nativeFields`
- `credentialBinding`: client-specific environment/header/profile references, excluded from structural drift by default
- `effectiveState`
- `compatibilityState`
- `lastObservedFingerprint`
- `differenceIntent`: unknown, intentional, pending-review

### DriftRelation

- `leftBindingId`
- `rightBindingId`
- `classification`: missing-binding, structural-difference, version-drift, name-collision, linked-alias, credential-binding-difference, unsupported-field
- `semanticDiff`
- `userResolution`

### SyncPlan

- `id`
- `sourceBindingId`
- `targets`
- `operations`
- `conflicts`
- `losses`
- `secretDependencies`
- `preconditions`
- `createdAt`
- `status`

### AuditOperation

- `id`
- `planId`
- `adapterVersions`
- `affectedPaths`
- `beforeHashes`
- `afterHashes`
- `snapshotId`
- `result`
- `warnings`
- `timestamp`

## 5. Compatibility model

Every source-target pair should produce one of these states:

| State | Meaning | Write behavior |
|---|---|---|
| Exact | Portable and target semantics match. | Normal confirmation. |
| Convertible | A deterministic, non-lossy conversion exists. | Show generated representation. |
| Partial | Some behavior or fields cannot be represented. | Strong warning and explicit field choices. |
| Unsupported | Target adapter cannot represent the artifact. | No write. |
| Blocked | Policy, permissions, version, malformed source, or secret prerequisites prevent safe write. | No write until resolved. |

Compatibility is computed from behavior, not only filenames or schema keys.

## 6. Mutation sequence

Mutation plans use explicit domain operations: `AddBinding`, `UpdateBinding`, `DisableBinding`, `RemoveBinding`, `UninstallContent`, `RemoveEverywhere`, and `RestoreSnapshot`. Removing a binding never implies deleting shared content.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Desktop UI
    participant P as Sync Planner
    participant T as Transaction Service
    participant A as Client Adapter
    participant F as Filesystem

    U->>UI: Select source and targets
    UI->>P: Build dry-run
    P->>A: Compare and plan
    A-->>P: Changes, conflicts, losses
    P-->>UI: Reviewable sync plan
    U->>UI: Confirm choices
    UI->>T: Execute approved plan
    T->>F: Recheck fingerprint and snapshot
    T->>A: Render and validate
    A-->>T: Validated output
    T->>F: Atomic replace
    T->>A: Re-read and verify
    alt Verification succeeds
        T-->>UI: Committed with rollback point
    else Any failure
        T->>F: Restore snapshot
        T-->>UI: Failed and restored
    end
```

## 7. Filesystem and process safety

- Resolve and normalize absolute paths before access.
- Require every write target to remain under an adapter-declared root or a user-approved custom root.
- Refuse traversal outside staging/target roots.
- Inspect symlinks and junctions before recursive operations.
- Use literal arguments, not shell-composed command strings.
- Set explicit working directories, timeouts, output limits, and cancellation behavior.
- Redact environment values and known secret patterns before persistence or display.
- Separate “connection test” from “save configuration”; neither implies the other.
- Route advanced Raw Config edits through parse, diff, snapshot, atomic write, and post-write validation; the raw editor is not a filesystem bypass.

## 8. Suggested repository layout

This layout is illustrative and should be adapted to ElectroBun's actual project conventions during scaffolding:

```text
AgentMindStudio/
  apps/
    desktop/
      ui/
      native/
  packages/
    domain/
    application/
    adapters/
      copilot/
        cli/
        vscode/
      codex/
      kiro/
      kilo/
      future/
    config-formats/
    transaction/
    skill-installer/
    persistence/
  fixtures/
    clients/
  tests/
    compatibility/
    roundtrip/
    failure-injection/
  docs/
    nexus/
    baseline/
    spikes/
```

## 9. Required test strategy

### Adapter golden tests

- Consume only TG-004 fixtures whose manifests and secret scans pass.
- Parse sanitized real-world fixtures.
- Normalize expected artifacts.
- Render after targeted changes.
- Compare bytes or semantic output while asserting unknown-field and comment preservation.

### Round-trip tests

- Read, normalize, render without changes, and confirm no unintended diff.
- Apply one supported change and confirm only expected bytes/fields differ.

### Compatibility tests

- Test exact, convertible, partial, unsupported, and blocked examples for every adapter pair in scope.

### Failure-injection tests

- File locked after planning.
- Fingerprint changes before commit.
- Disk full or permission denied during temporary write.
- Process crash between files in a multi-file operation.
- Post-write client validation fails.
- Rollback itself encounters a recoverable error.

### Security tests

- Traversal, symlink, and junction escape attempts.
- Malicious filenames and oversized files.
- Secret values in nested keys, arguments, headers, and logs.
- Package source containing scripts or deceptive manifests.
- Command injection through name, path, arguments, or environment declarations.

## 10. Do not implement as shortcuts

- Do not scan the entire user profile recursively.
- Do not deserialize and rewrite a whole configuration file to change one unrelated field without a preservation strategy.
- Do not infer writability from filesystem permissions alone.
- Do not use file paths as the only artifact identity.
- Do not store resolved secrets in the normalized database.
- Do not let the UI call arbitrary shell commands.
- Do not automatically mirror every external file watcher event.
- Do not label an adapter “supported” until restore and round-trip tests pass.
