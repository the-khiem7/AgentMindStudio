# AgentMindStudio — Assumptions, Decisions, and Evidence Log

**Baseline date:** 2026-07-15  
**Purpose:** Prevent unverified product assumptions from becoming implementation facts.

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

## 3. Verified external facts

The facts below were checked against official product documentation on 2026-07-15. They are evidence for the initial adapter model, not permanent guarantees.

| Client/ecosystem | Verified fact | Source |
|---|---|---|
| Codex | `CODEX_HOME` defaults to `~/.codex`; personal and project config layers exist; MCP uses TOML; global and repo instruction/skill locations differ. | [Codex docs](https://developers.openai.com/codex/config-basic) |
| Claude Code | Settings, MCP, instructions, and skills use multiple files and scope rules; project MCP can live in `.mcp.json`, while user/local MCP state can be in `~/.claude.json`. | [Settings](https://code.claude.com/docs/en/settings), [MCP](https://code.claude.com/docs/en/mcp) |
| Cursor | Global MCP uses `~/.cursor/mcp.json`, project MCP uses `.cursor/mcp.json`, and global versus project rule semantics differ. | [MCP](https://docs.cursor.com/context/model-context-protocol), [rules](https://docs.cursor.com/context/rules) |
| Kiro | Global, project, and agent scopes exist and have client-defined precedence. | [Kiro configuration](https://kiro.dev/docs/cli/chat/configuration/) |
| Kilo Code | Global core configuration is under `~/.config/kilo/`; skills may be under `~/.kilo/skills/`; project config has multiple accepted paths and precedence. | [Settings](https://kilo.ai/docs/getting-started/settings), [skills](https://kilo.ai/docs/customize/skills) |
| Cline | Global settings are separated under `~/.cline/data/settings/`; global/project rules and skills live in other roots, with compatibility paths also supported. | [Cline configuration](https://docs.cline.bot/getting-started/config) |
| Copilot CLI | Its user configuration directory can contain settings, MCP configuration, personal instructions, instruction folders, and skills. | [Copilot CLI config directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference) |
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

## 5. Open business decisions

Only the decisions below remain open.

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
| A-003 | Client configuration can be safely round-tripped with available parsers. | Golden-file fixture tests including comments and unknown fields. | Writes damage hand-maintained files. |
| A-004 | Manual reviewed operations are sufficient for MVP. | Prototype usability tests. | Auto-sync may need earlier prioritization. |
| A-005 | `npx skills` can provide stable enough machine-readable behavior for a desktop wrapper. | CLI spike across success, failure, cancel, and telemetry cases. | Requires library integration or custom installer. |
| A-006 | Client versions can be detected reliably. | Compare executable, extension, package, and config markers. | Compatibility status becomes misleading. |
| A-007 | Secret fields can be identified without resolving their values. | Test real sanitized MCP configs and false positives. | Export or diagnostics may leak secrets. |
| A-008 | ElectroBun supports the required filesystem, process, signing, and update flows on Windows. | Early packaging and process-runner spike. | Framework change or native helper required. |

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
