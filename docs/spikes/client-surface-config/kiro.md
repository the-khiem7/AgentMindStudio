# Kiro surface evidence

Reviewed: 2026-07-16  
Surface ID: `kiro` (`ide` and `cli` consumers)  
Scope: user/global, read-only evidence

## Verified source contract

| Artifact | User/global source | Format and signal | Ownership / precedence | Reload |
|---|---|---|---|---|
| MCP | `$KIRO_HOME/settings/mcp.json`; default `$HOME/.kiro/settings/mcp.json` | JSON `mcpServers`; no file-level schema version | User owned. CLI priority is agent > workspace > global; IDE documents workspace > global. | IDE applies changes on save and reconnects. CLI watches `mcp.json` and reconciles running servers. |
| Skill | `$KIRO_HOME/skills/*/SKILL.md` | Directory plus YAML-frontmatter Markdown | User owned. Same-name workspace skill wins over global. Default CLI agent loads both; custom agents require explicit resource URIs. | IDE imports are available immediately; CLI discovers at chat start, so start a new chat when stale. |
| Instruction | `$KIRO_HOME/steering/*.md`, including `AGENTS.md` | Markdown with optional `inclusion` frontmatter (`always`, `fileMatch`, `manual`, `auto`) | User owned, read-only in MVP. Workspace steering wins over conflicting global steering. | IDE guidance is immediately available; CLI reads steering automatically in chat. |

## Official evidence

- [Kiro IDE MCP configuration](https://kiro.dev/docs/mcp/configuration/)
  documents JSON shape, user/workspace paths, merge precedence, and apply-on-save.
- [Kiro CLI MCP configuration](https://kiro.dev/docs/cli/mcp/configuration/)
  documents agent/workspace/global priority and file-watcher reconciliation.
- [Kiro IDE skills](https://kiro.dev/docs/skills/) and
  [Kiro CLI skills](https://kiro.dev/docs/cli/skills/) document the shared
  user root, frontmatter, and workspace-over-global name priority.
- [Kiro IDE steering](https://kiro.dev/docs/steering/) and
  [Kiro CLI steering](https://kiro.dev/docs/cli/steering/) document global
  steering and activation modes.
- [Kiro CLI settings](https://kiro.dev/docs/cli/reference/settings/) documents
  the `KIRO_HOME` override.

## Sanitized local verification

The [metadata-only report](runs/20260716-ams-windows/results.json) observed
Kiro CLI `2.8.0` and regular documented MCP, skill, and steering sources. A
Kiro IDE installation was not detected in the reviewed VS Code extension list;
official evidence therefore establishes IDE behavior while the local result is
limited to path presence and CLI version.

## Unsupported or unknown

- Conflict ordering among multiple steering files in the same scope is not a
  stable documented contract.
- IDE agent-specific MCP layers are not treated as writable user/global sources.
- All instruction behavior remains read-only regardless of client support.
