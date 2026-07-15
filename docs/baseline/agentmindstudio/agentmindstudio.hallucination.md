# AgentMindStudio — Assumptions, Decisions, and Evidence Log

**Baseline date:** 2026-07-15  
**Purpose:** Prevent unverified product assumptions from becoming implementation facts.

**Authority:** This evidence log inherits product intent from the [Project Nexus](../../nexus/README.md).

**Technical readiness:** Assumption-validation work must update the relevant gate and evidence link in [agentmindstudio.technical-gates.md](agentmindstudio.technical-gates.md).

## 1. Confirmed decisions

These statements come directly from the product request and can be treated as current decisions:

| ID | Decision | Consequence |
|---|---|---|
| D-001 | Build a desktop application with ElectroBun. | Architecture and packaging work should target an ElectroBun desktop shell. |
| D-002 | Windows is the initial platform because it is the user's active development environment; the architecture must remain portable to macOS later. | Implement Windows first, but isolate filesystem roots, process execution, secret storage, packaging, and path rules behind platform interfaces. |
| D-003 | The product must visually manage MCP, skills, instructions, and related configuration. | Raw file editing alone does not satisfy the product need. |
| D-004 | The product must show configuration coverage and differences across AI clients. | The UI must make gaps explicit, such as an MCP present in Kilo but absent in Copilot, or a skill present in Copilot but absent in Kiro. |
| D-005 | MVP client scope is GitHub Copilot, Codex, Kiro, and Kilo Code. Other clients are future adapters. | The initial implementation targets four clients while keeping the adapter and domain contracts extensible. |
| D-006 | All supported `npx skills` CLI capabilities should ultimately be operable through UI/UX without requiring terminal commands. | The UI command surface includes discovery, listing, installation, one-time use, update, removal, and initialization as upstream capabilities are supported. |
| D-007 | Client configuration files remain authoritative. AMS does not maintain a canonical mirror that automatically overrides them. | Every scan reads current files; writes occur only through an explicit user operation. |
| D-008 | MCP credentials and credential references may differ by client and must be preserved as per-client overrides. | Structural drift and credential-binding differences are classified separately; AMS never deletes or normalizes a credential merely because another client differs. |
| D-009 | AMS manages global/user scope only and does not scan projects or drives for project configuration. | Discovery is bounded to known global roots plus explicit custom global roots. |
| D-010 | MVP synchronization and mutation are manual. Automatic synchronization for selected clients is deferred. | No background write or auto-remediation exists in MVP. |
| D-011 | MVP supports Copilot, Codex, Kiro, and Kilo for both inventory and planned write features. | Claude Code, Cursor, Cline, and other clients are post-MVP adapters. |
| D-012 | Advanced users can edit Raw Config as an exceptional workflow. | Raw editing must still use validation, diff, snapshot, confirmation, and rollback. |
| D-013 | SQLite stores AMS metadata; filesystem storage holds restorable snapshot content. | Client files remain authoritative and are not duplicated into SQLite as a second live configuration source. |
| D-014 | Harness surfaces are modeled explicitly; a common config source is recorded only when verified. | One resolved file may serve several surfaces, while Copilot CLI and VS Code remain distinct where their sources differ. |
| D-015 | Same-name/different-endpoint MCPs are conflicts; different-name/same-endpoint MCPs are linkable aliases. | MCP identity uses endpoint evidence and reviewed alias relationships, not name alone. |
| D-016 | The main conflict experience is a source-control-style semantic Diff UI. | Raw and semantic differences, affected paths, and operations are visible before Apply. |
| D-017 | The official skills CLI is wrapped behind a stable gateway and pinned to `skills@1.5.17`. | Upgrades require an isolated spike; UI handles contract failures without mutating user config. |
| D-018 | Unknown client versions use a schema/capability gate. | Unverified versions can remain readable while unsafe or lossy writes are blocked. |
| D-019 | The greenfield foundation is a Project Nexus above baseline packs. | Product invariants live in Nexus; baselines track planned and implemented work. |
| D-020 | Both Copilot CLI and Copilot VS Code are MVP surfaces. | They remain distinct adapters/capability sets and AMS manages only their user/global sources. |
| D-021 | Google Stitch is the UI exploration tool and shadcn/ui is the production implementation foundation. | Generated designs inform the product, while maintained component source stays in the repository. |
| D-022 | Instruction/rule support is read-only in MVP. | Inventory, activation/precedence analysis, coverage, and diff are allowed; instruction mutation is deferred. |

## 2. Observed local evidence

Only path existence was inspected; no configuration content or credentials were read.

| Candidate under `C:\Users\TheKhiem7` | Observed on 2026-07-15 |
|---|---|
| `.codex` | Present |
| `.claude` | Present |
| `.cursor` | Present |
| `.kiro` | Present |
| `.config\kilo` | Present |
| `.kilo` | Not present |
| `.cline` | Present |
| `.copilot` | Present |
| `Documents\Cline` | Present |
| `AppData\Roaming\Code\User\globalStorage\kilocode.kilo-code` | Present |

This supports local discovery feasibility, but does not prove that each path contains valid or active configuration.

TG-001 also produced local runtime evidence on 2026-07-15: ElectroBun 1.18.1 with Bun 1.3.13 and SQLite 3.51.2 passed the required Windows filesystem, process, SQLite, stable packaging, and non-elevated packaged-runtime checks. See the [spike report](../../spikes/electrobun-foundation/2026-07-15-electrobun-1.18.1-windows.md) and [machine-readable result](../../spikes/electrobun-foundation/runs/20260715-174500/results.json). This evidence does not cover signing, installer execution, or production update delivery.

## 3. Verified external facts

The facts below were checked against official product documentation on 2026-07-15. They are evidence for the initial adapter model, not permanent guarantees.

| Client/ecosystem | Verified fact | Source |
|---|---|---|
| Codex | App, CLI, and IDE share the same `~/.codex/config.toml` MCP configuration on the same host. | [Codex MCP](https://developers.openai.com/codex/mcp) |
| Claude Code | Settings, MCP, instructions, and skills use multiple files and scope rules; project MCP can live in `.mcp.json`, while user/local MCP state can be in `~/.claude.json`. | [Settings](https://code.claude.com/docs/en/settings), [MCP](https://code.claude.com/docs/en/mcp) |
| Cursor | Global MCP uses `~/.cursor/mcp.json`, project MCP uses `.cursor/mcp.json`, and global versus project rule semantics differ. | [MCP](https://docs.cursor.com/context/model-context-protocol), [rules](https://docs.cursor.com/context/rules) |
| Kiro | IDE and CLI both document `~/.kiro/settings/mcp.json` for global MCP; workspace and agent layers remain separate. | [IDE MCP](https://kiro.dev/docs/mcp/configuration/), [CLI MCP](https://kiro.dev/docs/cli/mcp/configuration/) |
| Kilo Code | CLI, VS Code, and JetBrains read the same documented JSONC core configuration; skills can still use a different root. | [Settings](https://kilo.ai/docs/getting-started/settings), [skills](https://kilo.ai/docs/customize/skills) |
| Cline | Global settings are separated under `~/.cline/data/settings/`; global/project rules and skills live in other roots, with compatibility paths also supported. | [Cline configuration](https://docs.cline.bot/getting-started/config) |
| Copilot | CLI uses `~/.copilot/mcp-config.json`; VS Code MCP configuration is a distinct source/format rather than a universal shared harness file. | [CLI config directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference), [CLI commands](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference) |
| skills.sh | The documented primary installation method is `npx skills add`; anonymous telemetry is documented with `DISABLE_TELEMETRY=1` opt-out. | [skills CLI](https://www.skills.sh/docs/cli) |

## 4. Closed former open decisions

The following items retain their original `OD` identifiers for history but are no longer open.

| Original ID | Closed direction | Product effect |
|---|---|---|
| OD-001 | Client config files are authoritative; AMS is an explicit-operation control plane, not a continuously enforced source of truth. | SQLite stores observations and operation metadata, not a canonical replacement for client config. |
| OD-002 | MCP credential bindings are per-client overrides. | Compare portable MCP structure separately from `env`, headers, token references, and client-specific credential profiles. Preserve target overrides by default. |
| OD-003 | Global/user scope only. | No project scan, repository discovery, or project-scope write workflow. |
| OD-005 | Manual operation in MVP; selected-client auto-sync later. | Drift is informational until the user creates and confirms an operation. |
| OD-006 | MVP client set is Copilot, Codex, Kiro, and Kilo. | Other clients are expansion adapters, not MVP read targets. |
| OD-007 | Raw Config editing is supported as an advanced path. | UI forms remain primary; raw writes use the same safety transaction as structured changes. |
| OD-008 | SQLite for metadata and filesystem for snapshot bytes. | AMS can relate observations and recover operations without replacing client-owned files. |
| OD-004 | Wrap the official CLI through `SkillCommandGateway`, pin `skills@1.5.17`, and require isolated compatibility spikes. | No dependency on undocumented package exports or human CLI text in UI code. |
| OD-009 | Use a schema/capability gate. | Warn for unverified versions; block writes only when parse, preservation, validation, or safe round-trip cannot be demonstrated. |
| OD-010 | Use portable/manual builds for private MVP; defer signed public updates. | Signing, update feeds, migration rollback, and downgrade behavior move to a later release phase. |
| NOD-001 | Support both Copilot CLI and Copilot VS Code as separate MVP surfaces. | Separate discovery, capability, fixture, and binding behavior; no project-scope expansion. |
| NOD-002 | Google Stitch for exploration, then shadcn/ui for production implementation. | Stitch output is not the maintained UI source of truth. |
| NOD-003 | Instruction/rule support is read-only in MVP. | No instruction create, edit, sync, remove, conversion, or raw write. |

## 5. Superseded option analysis

OD-004, OD-009, and OD-010 are closed in section 4. Their option analysis is retained below as decision history; the former recommendations are now the selected directions.

### OD-004 — skills.sh integration boundary

Should the app invoke `npx skills`, call a reusable upstream library, or implement its own downloader?

Options:

1. **Wrap the official CLI process:** highest behavioral parity and fastest access to `add`, `use`, `list`, `find`, `remove`, `update`, and `init`; requires Node.js and a stable way to interpret progress, prompts, errors, and cancellation.
2. **Use an upstream programmatic library:** enables richer progress and fewer terminal-oriented interactions if a supported API exists; creates tighter version, packaging, and upstream API coupling.
3. **Reimplement the installer:** gives maximum UX and validation control; creates the highest maintenance and compatibility risk because AMS must reproduce upstream discovery, agent paths, symlink/copy behavior, update, and removal rules.

**Current recommendation:** Define an internal `SkillCommandGateway`. Use the official CLI through an argument-safe process adapter for MVP, but stage and independently verify the result. Do not let UI code depend directly on CLI text output so a supported library backend can replace it later.

### OD-009 — Version support policy

Define how long an adapter version remains supported and what happens when an unknown client version is detected.

Options:

1. **Strict version gate:** block all writes when the detected client version is newer than the verified range. Safest, but frequent client releases can make AMS unnecessarily unusable.
2. **Schema/capability gate:** warn on an unverified client version, then decide write safety from the actual parsed config shape, required fields, and round-trip validation.
3. **Always allow:** rely on snapshot and rollback. Most flexible, but a rollback cannot prevent every semantic incompatibility.

**Current recommendation:** Use the schema/capability gate. An unknown version is a warning, not an automatic block. Block only when the adapter cannot parse, preserve, validate, or safely round-trip the observed format. Raw Config remains available with an advanced warning and snapshot.

### OD-010 — Distribution and update channel

Define installer, signing certificate, update service, rollback, and offline-install requirements.

Options:

1. **Portable/manual build:** fastest for personal MVP testing, no background updater, and easy side-by-side rollback; Windows may show trust warnings and upgrades are manual.
2. **Installer with signed releases and manual updates:** better Windows trust and uninstall behavior, but requires certificate and release pipeline work.
3. **Signed auto-update:** best long-term convenience, but requires update-feed integrity, interrupted-update recovery, database migration policy, and application downgrade behavior.

**Current recommendation:** Use a portable or simple manual installer for private MVP testing. Before public release, require signed releases; add opt-in auto-update only after update rollback and SQLite migration behavior are tested.

## 6. Assumptions requiring validation

| ID | Assumption | Validation method | Risk if false |
|---|---|---|---|
| A-001 | All initial users operate as one Windows user with access to their own global configuration paths. | Pilot interviews and permission tests. | Requires elevation or multi-user architecture. |
| A-002 | Most valuable portable assets are MCP, skills, and instructions. | Inventory current users and rank migration pain. | MVP targets the wrong asset mix. |
| A-003 | Client configuration can be safely round-tripped with available parsers. | TG-003 source evidence plus TG-004 golden fixtures, including comments and unknown fields. | Writes damage hand-maintained files. |
| A-004 | Manual reviewed operations are sufficient for MVP. | Prototype usability tests. | Auto-sync may need earlier prioritization. |
| A-005 | The pinned skills CLI remains usable behind guarded semantic checks despite incomplete structured output. | Repeat the project-scoped isolated spike for every candidate version and wrapper change. | Freeze upgrades or replace the backend. |
| A-006 | Client versions can be detected reliably. | Compare executable, extension, package, and config markers. | Compatibility status becomes misleading. |
| A-007 | Secret fields can be identified without resolving their values. | TG-004 sanitized fixture tests plus TG-006 threat-model security cases. | Export or diagnostics may leak secrets. |
| A-008 | ElectroBun signing, installer execution, and production update delivery meet release requirements on Windows. | Signed release-candidate installation, update, rollback, and recovery tests in Phase 7. | Release packaging, signing, or update architecture must change. |

## 7. Rejected assumptions

- **R-001:** “All configuration is one `mcp.json` file.” Rejected; official clients use multiple formats and scopes.
- **R-002:** “Everything under the user's home directory is safe to synchronize.” Rejected; auth, sessions, histories, caches, logs, databases, and managed policy are not portable configuration.
- **R-003:** “Same MCP server name means same definition.” Rejected; scope precedence and client-specific fields can differ.
- **R-004:** “A valid parse means a safe write.” Rejected; formatting, comments, external changes, policy, and semantic validation also matter.
- **R-005:** “Skills are always directly portable.” Rejected; clients can add frontmatter, invocation, precedence, or path requirements.
- **R-006:** “Installing a skill is harmless content copying.” Rejected; downloaded repositories and bundled scripts are a supply-chain boundary.
- **R-007:** “Global config always lives in one dot-folder named after the client.” Rejected; Kilo and Cline demonstrate split roots.
- **R-008:** “The app can manage enterprise policy like user settings.” Rejected; managed layers have different authority and may be intentionally immutable.
- **R-009:** “A structural MCP match requires identical credentials across clients.” Rejected; each client can intentionally use a different credential profile.
- **R-010:** “Global management requires recursively scanning the drive for projects.” Rejected; AMS is bounded to global roots and explicit user-selected global locations.

- **R-011:** "Every surface in one harness always reads one shared source." Rejected; sharing is true for several documented sources but not universal, notably across Copilot CLI and VS Code.

## 8. Unknowns to keep visible in UI and diagnostics

- Detected client version versus adapter verification range.
- Whether a layer is loaded by the current client instance.
- Whether an external UI or running process rewrote a file after scan.
- Whether a target supports an exact semantic equivalent.
- Whether an MCP command or remote endpoint is trustworthy.
- Whether a downloaded skill's source changed since installation.
- Whether a client needs reload, restart, or a new session to observe changes.
- Whether a value is an ordinary string or an embedded secret not matching known patterns.
- Whether a per-client credential difference is intentional; AMS must preserve it unless the user explicitly replaces it.

## 9. Decision log template

When an open decision closes, append an entry with:

- Decision ID and date
- Chosen option
- Alternatives rejected
- Business rationale
- Security/runtime consequence
- Affected baseline files
- Migration or compatibility consequence
