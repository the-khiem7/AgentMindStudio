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
| NOD-001 (closed) | Support both Copilot CLI and Copilot VS Code in the writable MVP as distinct surfaces. | Each surface has separate sources, capabilities, fixtures, and bindings; AMS still manages user/global sources only. |
| NOD-002 (closed) | Use Google Stitch for design exploration and shadcn/ui for production implementation. | Stitch output is a prototype input; the maintained UI source lives in owned shadcn/ui-based components. |
| NOD-003 (closed) | Instruction/rule support is read-only in MVP. | AMS inventories, classifies, compares, and shows coverage for instructions but does not create, edit, sync, remove, or raw-write instruction sources. |

## Open decisions

No Nexus-level decisions from the current business-analysis set remain open. New unknowns must be added here before an implementation silently chooses a direction.

## Decision process

Close an open decision only with: selected option, rationale, affected Nexus/baseline files, migration consequence, and verification evidence where applicable.
