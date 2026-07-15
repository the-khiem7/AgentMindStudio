# Capability Map

## MVP capabilities

| Capability | User value | Minimum safe behavior |
|---|---|---|
| Client discovery | Know which supported harnesses and surfaces exist | Read-only path resolution and health status |
| Unified inventory | See MCP, skills, instructions, and layers together | Provenance, resolved path, support level, no writes |
| Coverage and drift | See what Copilot lacks compared with Kiro or Kilo | Semantic classifications, intentional overrides, diff UI |
| Manual synchronization | Copy or adapt one selected asset | Capability gate, preview, snapshot, explicit confirmation |
| MCP management | Add, update, disable, remove, and link aliases | Preserve per-client credential bindings |
| Skill command center | Use skills workflows without terminal syntax | Pinned runner, isolated staging, guarded parsing, clear errors |
| Raw Config | Handle unsupported edge cases | Parse validation, semantic/line diff, same transaction pipeline |
| Recovery and audit | Explain and reverse AMS changes | SQLite operation journal plus filesystem snapshot bytes |

## Why SQLite is more than CRUD storage

Filesystem config tells AMS the current bytes, but not the relationships or intent behind them. SQLite provides durable answers to questions that files alone cannot answer:

- Which aliases across clients represent one logical MCP?
- Is a missing item intentional, newly drifted, or never supported?
- Which bindings still reference shared skill content before uninstall?
- Which file hashes were previewed and confirmed for an operation?
- Did a previous write crash after snapshot but before verification?
- Which snapshot belongs to which operation and affected paths?
- Which adapter/schema version produced an observation?

SQLite therefore stores a control-plane graph and operation state machine: logical assets, aliases, bindings, observations, capabilities, plans, audits, and snapshot indexes. The app may expose CRUD-like screens, but writes are domain operations with safety invariants, not arbitrary row CRUD.

SQLite is not a secret vault. Store redacted fingerprints or references to credentials, not raw tokens. If AMS later manages secret values, use an operating-system credential store behind a dedicated port.

## Deferred capabilities

- Automatic synchronization between selected clients.
- Project-scope discovery and management.
- Named portable profiles and encrypted export bundles.
- Additional harness adapters.
- Team policy and managed catalogs.
- Signed public distribution and automatic updates.
