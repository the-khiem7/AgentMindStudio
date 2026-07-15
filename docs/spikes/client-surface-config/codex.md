# Codex surface evidence

Reviewed: 2026-07-16  
Surface ID: `codex` (`desktop`, `cli`, and `ide-extension` consumers)  
Scope: user/global, read-only evidence

## Verified source contract

| Artifact | User/global source | Format and signal | Ownership / precedence | Reload |
|---|---|---|---|---|
| MCP | `$CODEX_HOME/config.toml`; default `$HOME/.codex/config.toml` | TOML, `[mcp_servers.<name>]`; no file-level schema version | User owned. Trusted project `.codex/config.toml` is a closer layer. The adapter must retain source/layer identity rather than flattening it. | The IDE MCP flow says to restart the extension. For direct CLI edits AMS reports “new session/restart” rather than claiming hot reload. |
| Skill | `$HOME/.agents/skills/*/SKILL.md` | Directory plus YAML-frontmatter Markdown; `name` and `description` required | User owned. Repository, admin, and bundled roots are separate owners. Same-name skills are not merged and can both appear, so AMS must not invent a winner. | Codex detects changes automatically; restart if an update is not visible. |
| Instruction | `$CODEX_HOME/AGENTS.override.md`, otherwise `$CODEX_HOME/AGENTS.md` | Non-empty Markdown selected by filename | User owned, read-only in MVP. Global guidance loads first; project-root-to-CWD guidance is appended later. `AGENTS.override.md` wins within a directory. | The chain is built once per run/session; start a new command or restart the session. |

The MCP source is shared by the desktop app, CLI, and IDE extension. This is a
verified shared-source relationship, not a claim that every Codex artifact is
stored in `config.toml`.

## Official evidence

- [Codex MCP](https://developers.openai.com/codex/mcp) documents the default
  `~/.codex/config.toml`, MCP table shapes, and shared desktop/CLI/IDE use.
- [Build skills](https://developers.openai.com/codex/skills) documents the
  current user root as `~/.agents/skills`, skill format, duplicate-name
  behavior, automatic detection, and restart fallback.
- [AGENTS.md guidance](https://developers.openai.com/codex/guides/agents-md)
  documents `CODEX_HOME`, override selection, root-to-CWD ordering, and
  once-per-run discovery.

## Sanitized local verification

The [metadata-only report](runs/20260716-ams-windows/results.json) observed
Codex CLI `0.125.0`, a regular `$CODEX_HOME/config.toml`, a user
`$HOME/.agents/skills` directory, and a reparse-point
`$CODEX_HOME/AGENTS.md`. The probe did not follow or read that reparse point;
production discovery must preserve the reparse-point fact for TG-006 policy.

## Unsupported or unknown

- No file-level schema version exists; client and adapter versions remain
  capability evidence.
- Exact same-key conflict behavior across user and project TOML must be proven
  before any write claim.
- This record authorizes read fixtures only. It does not establish comment,
  unknown-field, or credential-preserving writes.
