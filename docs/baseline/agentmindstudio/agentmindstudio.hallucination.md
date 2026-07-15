# AgentMindStudio — Assumptions, Decisions, and Evidence Log

**Baseline date:** 2026-07-15  
**Purpose:** Prevent unverified product assumptions from becoming implementation facts.

## 1. Confirmed decisions

These statements come directly from the product request and can be treated as current decisions:

| ID | Decision | Consequence |
|---|---|---|
| D-001 | Build a desktop application with ElectroBun. | Architecture and packaging work should target an ElectroBun desktop shell. |
| D-002 | Windows is the initial feasible environment. | Use Windows user-profile semantics and Windows-specific security/testing first. |
| D-003 | The product must visually manage MCP, skills, instructions, and related configuration. | Raw file editing alone does not satisfy the product need. |
| D-004 | The product must reduce configuration duplication across AI clients. | A normalized cross-client compatibility model is core scope. |
| D-005 | Copilot, Codex, Claude Code, Kiro, Kilo Code, Cline, and Cursor are target clients. | The adapter contract must accommodate all seven, even if write support is phased. |
| D-006 | A UI workflow for skills.sh installation is required. | A controlled CLI/process bridge or equivalent library integration is core scope. |

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

## 4. Open business decisions

These decisions must be closed before their dependent phase starts.

### OD-001 — Source of truth

Should AgentMindStudio own a canonical local copy, or should it only maintain profiles and generate plans from client-owned files?

**Recommendation:** Start with an advisory logical asset catalog. Client files remain authoritative until the user explicitly creates a managed profile. This minimizes surprise and permits gradual adoption.

### OD-002 — Secret storage

Should MVP use environment-variable references only, Windows Credential Manager, or an encrypted application vault?

**Recommendation:** Portable artifacts contain environment-variable names only. If secret convenience is required, add Windows Credential Manager behind a separate explicit feature; do not invent application encryption casually.

### OD-003 — Project-scope writes

Should MVP edit repository configuration or restrict writes to user/global layers?

**Recommendation:** Inventory both, but write user/global first. Project writes can create version-control and team-policy consequences and need dedicated UX.

### OD-004 — skills.sh integration boundary

Should the app invoke `npx skills`, call a reusable upstream library, or implement its own downloader?

**Recommendation:** Put all options behind an internal `SkillInstaller` contract. Prototype direct `npx` invocation first because it matches documented behavior, but stage files and verify outputs independently.

### OD-005 — Automatic synchronization

Should changes propagate automatically after external file edits?

**Recommendation:** No automatic writes in MVP. Detect drift and offer a reviewed plan. Continuous sync requires explicit ownership, loop prevention, and conflict policy.

### OD-006 — First write-capable client cohort

Should all seven clients be writable in MVP?

**Recommendation:** Provide read inventory for all and prove writes with Codex, Claude Code, and Cursor first. Expand only after the adapter contract survives real fixtures.

### OD-007 — Raw editor

Should users be able to edit arbitrary configuration text inside the app?

**Recommendation:** Provide a redacted read-only raw view in MVP. A raw write editor undermines validation and makes ownership unclear.

### OD-008 — Metadata persistence

Choose between SQLite, a file-based database, or manifest-only local storage for profiles, fingerprints, snapshots, and audit history.

**Recommendation:** Use SQLite for metadata plus filesystem snapshot content, but validate ElectroBun packaging, locking, and backup constraints in a spike.

### OD-009 — Version support policy

Define how long an adapter version remains supported and what happens when an unknown client version is detected.

**Recommendation:** Continue read-only best-effort discovery with an “unverified version” label; block writes until the adapter's fixture range is verified or the user explicitly enters an advanced override.

### OD-010 — Distribution and update channel

Define installer, signing certificate, update service, rollback, and offline-install requirements.

## 5. Assumptions requiring validation

| ID | Assumption | Validation method | Risk if false |
|---|---|---|---|
| A-001 | All initial users operate as one Windows user with access to their own configuration paths. | Pilot interviews and permission tests. | Requires elevation or multi-user architecture. |
| A-002 | Most valuable portable assets are MCP, skills, and instructions. | Inventory current users and rank migration pain. | MVP targets the wrong asset mix. |
| A-003 | Client configuration can be safely round-tripped with available parsers. | Golden-file fixture tests including comments and unknown fields. | Writes damage hand-maintained files. |
| A-004 | Users prefer reviewed one-time sync over background sync initially. | Prototype usability tests. | Product feels too manual. |
| A-005 | `npx skills` can provide stable enough machine-readable behavior for a desktop wrapper. | CLI spike across success, failure, cancel, and telemetry cases. | Requires library integration or custom installer. |
| A-006 | Client versions can be detected reliably. | Compare executable, extension, package, and config markers. | Compatibility status becomes misleading. |
| A-007 | Secret fields can be identified without resolving their values. | Test real sanitized MCP configs and false positives. | Export or diagnostics may leak secrets. |
| A-008 | ElectroBun supports the required filesystem, process, signing, and update flows on Windows. | Early packaging and process-runner spike. | Framework change or native helper required. |

## 6. Rejected assumptions

- **R-001:** “All configuration is one `mcp.json` file.” Rejected; official clients use multiple formats and scopes.
- **R-002:** “Everything under the user's home directory is safe to synchronize.” Rejected; auth, sessions, histories, caches, logs, databases, and managed policy are not portable configuration.
- **R-003:** “Same MCP server name means same definition.” Rejected; scope precedence and client-specific fields can differ.
- **R-004:** “A valid parse means a safe write.” Rejected; formatting, comments, external changes, policy, and semantic validation also matter.
- **R-005:** “Skills are always directly portable.” Rejected; clients can add frontmatter, invocation, precedence, or path requirements.
- **R-006:** “Installing a skill is harmless content copying.” Rejected; downloaded repositories and bundled scripts are a supply-chain boundary.
- **R-007:** “Global config always lives in one dot-folder named after the client.” Rejected; Kilo and Cline demonstrate split roots.
- **R-008:** “The app can manage enterprise policy like user settings.” Rejected; managed layers have different authority and may be intentionally immutable.

## 7. Unknowns to keep visible in UI and telemetry

- Detected client version versus adapter verification range.
- Whether a layer is loaded by the current client instance.
- Whether an external UI or running process rewrote a file after scan.
- Whether a target supports an exact semantic equivalent.
- Whether an MCP command or remote endpoint is trustworthy.
- Whether a downloaded skill's source changed since installation.
- Whether a client needs reload, restart, or a new session to observe changes.
- Whether a value is an ordinary string or an embedded secret not matching known patterns.

## 8. Decision log template

When an open decision closes, append an entry with:

- Decision ID and date
- Chosen option
- Alternatives rejected
- Business rationale
- Security/runtime consequence
- Affected baseline files
- Migration or compatibility consequence
