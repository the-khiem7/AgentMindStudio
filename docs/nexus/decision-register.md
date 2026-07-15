# Nexus Decision Register

## Closed decisions

| ID | Decision | Consequence |
|---|---|---|
| ND-001 | Windows-first, with platform ports for future macOS support. | No Windows path or process rule leaks into the domain model. |
| ND-002 | MVP harnesses are Copilot, Codex, Kiro, and Kilo. | Other harnesses use future adapters. |
| ND-003 | MVP manages global/user scope only. | No repository or drive-wide project scanning. |
| ND-004 | Live client files are authoritative. | SQLite records observations and operations; it does not continuously enforce a canonical copy. |
| ND-005 | All MVP mutations and synchronization are manual and reviewed. | Auto-sync is deferred. |
| ND-006 | Credential bindings may differ per client and are preserved by default. | Credential differences are not automatically repaired drift. |
| ND-007 | SQLite stores metadata and operation state; filesystem stores snapshot bytes. | Durable relationships and recovery exist without duplicating live config. |
| ND-008 | MCP identity uses endpoint evidence plus aliases, not name alone. | Same-name/different-endpoint is a conflict; different-name/same-endpoint is linkable. |
| ND-009 | Drift resolution uses a source-control-style semantic Diff UI. | Users see exact fields, targets, and effects before applying. |
| ND-010 | MVP wraps the official `skills` CLI through a stable gateway pinned to `1.5.17`. | Upgrades require an isolated compatibility spike; output/exception changes surface as UI errors. |
| ND-011 | Unknown config versions use a schema/capability gate. | Read is allowed where possible; unsafe or lossy writes are blocked, with advanced Raw Config remaining guarded. |
| ND-012 | Private MVP uses a portable/manual Windows build. | Signing and auto-update are deferred until public distribution. |
| ND-013 | Greenfield product truth starts in the Nexus; baseline packs inherit it. | Baselines track execution without redefining product invariants. |

## Open decisions

| ID | Question | Current recommendation |
|---|---|---|
| NOD-001 | Which Copilot surface is in the first writable MVP: CLI, VS Code, or both? | Implement distinct surface capabilities; choose one first rather than pretending their config source is shared. |
| NOD-002 | Which UI workflow becomes the production design source? | Explore with Google Stitch, implement with shadcn/ui, and customize the diff/coverage experience. |
| NOD-003 | Which instruction/rule families are first-class in the first vertical slice? | Start with the four harnesses' global instruction roots proven by sanitized fixtures. |

## Decision process

Close an open decision only with: selected option, rationale, affected Nexus/baseline files, migration consequence, and verification evidence where applicable.
