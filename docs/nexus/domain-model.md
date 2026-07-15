# Domain Model and Invariants

## Harness, surface, source, and layer

- **Harness:** the product family, such as Codex or Copilot.
- **Surface:** a concrete app/runtime in that family, such as CLI, desktop, VS Code, or JetBrains.
- **Config source:** a resolved file or directory read by a surface.
- **Config layer:** one precedence level within a source, such as user settings, managed policy, or compatibility path.
- **Binding:** the representation of one logical asset in one surface/layer.

One harness can have several surfaces. Several surfaces may share one source, but that relationship must be declared by adapter evidence rather than assumed. AMS deduplicates a resolved source path so the same file is not parsed or written twice.

## MCP logical identity

MCP display names are aliases, not sufficient identity. AMS derives an `endpointFingerprint` from:

- transport type;
- normalized URL for remote transports; or
- normalized command plus identity-bearing arguments for local transports.

Credentials, environment values, headers, enabled state, and client-only fields are excluded from the endpoint fingerprint.

| Names | Endpoint fingerprint | Classification | Default action |
|---|---|---|---|
| Same | Same | Same logical MCP candidate | Compare fields and bindings |
| Same | Different | `NameCollision` conflict | Never auto-merge; show semantic diff |
| Different | Same | `LinkedAlias` candidate | Link as one logical MCP with two aliases after review |
| Different | Different | Different MCPs | Keep separate |

Therefore, two MCPs with the same name but different URLs are a conflict. Two differently named MCPs with the same URL or launch tuple are related and may be represented by one logical MCP with client-specific aliases.

## Skill logical identity

A folder name alone is not sufficient identity. Use this evidence in descending order:

1. recorded source/repository plus skill name and pinned revision;
2. upstream manifest identity plus content fingerprint;
3. normalized content fingerprint when provenance is unavailable;
4. explicit user link.

Classifications:

- Same identity, different content: `VersionDrift`.
- Same name, different provenance: `NameCollision`; do not merge automatically.
- Different names, same provenance and equivalent content: `LinkedAlias` candidate.
- Copied directories with no provenance: `PossibleDuplicate` until confirmed.

Instructions follow the same provenance/content approach, with target path and precedence layer included in the binding.

## Drift is descriptive, not corrective

Drift types include `MissingBinding`, `StructuralDifference`, `VersionDrift`, `NameCollision`, `AliasDifference`, `CredentialBindingDifference`, and `UnsupportedField`.

`CredentialBindingDifference` can be intentional and is never repaired by default. A drift record becomes a write only after the user selects an explicit operation and confirms its plan.

## Diff UI contract

The default compare experience resembles a source-control diff but adds domain meaning:

- side-by-side client columns and an optional unified view;
- raw line diff plus semantic sections such as endpoint, arguments, enabled state, credentials, and client-only fields;
- coverage row states: present, missing, linked alias, conflict, incompatible, and intentional override;
- secrets redacted while preserving whether bindings differ;
- per-section actions such as copy left to right, keep both, link aliases, or edit target;
- exact target files and rollback snapshot shown before Apply.

Color is never the only signal.

## Mutation vocabulary

| Operation | Meaning | What it must not do |
|---|---|---|
| `AddBinding` | Create a representation of an existing logical asset in a selected target | Change other client bindings |
| `UpdateBinding` | Change selected portable or target-specific fields | Replace target credentials unless explicitly selected |
| `DisableBinding` | Preserve definition/content but mark it inactive where supported | Delete the asset |
| `RemoveBinding` | Remove one client/surface reference | Delete shared physical content still referenced elsewhere |
| `UninstallContent` | Delete installed skill/instruction bytes after proving no retained binding needs them | Fan out to every client implicitly |
| `RemoveEverywhere` | Explicit multi-target plan composed of binding removals and optional content deletion | Run without target enumeration and confirmation |
| `RestoreSnapshot` | Restore bytes from a known operation snapshot and verify parsing | Erase the audit record being restored from |

Every operation is planned, previewed, snapshotted, rechecked for external changes, applied, parsed again, and audited. If verification fails, AMS restores the snapshot where possible and reports partial recovery explicitly.
