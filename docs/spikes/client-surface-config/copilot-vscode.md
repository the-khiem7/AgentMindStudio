# GitHub Copilot in VS Code surface evidence

Reviewed: 2026-07-16  
Surface ID: `copilot-vscode`  
Scope: user/global, read-only evidence

## Verified source contract

| Artifact | User/global source | Format and signal | Ownership / precedence | Reload |
|---|---|---|---|---|
| MCP | Resolve through **MCP: Open User Configuration** for the active VS Code profile; default-profile candidate is `$APPDATA/Code/User/mcp.json` | JSONC `servers` plus VS Code MCP schema | User-profile owned. Workspace and profile sources coexist; the official page does not state a deterministic same-name winner. | A changed configuration restarts the affected server; automatic start is optional/experimental. |
| Skill | `$HOME/.copilot/skills`, `$HOME/.claude/skills`, and `$HOME/.agents/skills` | Directory plus Agent Skills frontmatter; name must match parent directory | User owned. Project and personal locations are both discovered; same-name precedence is not documented on the current VS Code page. | Refresh Configure Skills; restart extension host only if stale. |
| Instruction | User-profile `*.instructions.md` resolved through **Chat: Configure Instructions** | YAML-frontmatter Markdown (`applyTo` or semantic description) | User-profile owned, read-only in MVP. Personal > repository > organization; ordering within a category is not guaranteed. | Applies to the next chat request; Chat Diagnostics shows loaded sources. |

The adapter must ask VS Code to resolve active-profile paths or use a
profile-aware platform port. It must not assume the default-profile physical
path when multiple profiles exist.

## Official evidence

- [VS Code MCP servers](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
  documents profile-aware `mcp.json`, the user configuration command, JSON
  shape, trust, and restart behavior.
- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
  documents personal roots and required frontmatter.
- [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
  documents user-profile instructions, priority, non-deterministic within-set
  order, and diagnostics.

## Sanitized local verification

The [metadata-only report](runs/20260716-ams-windows/results.json) observed VS
Code `1.128.1` and a regular default-profile MCP candidate. The GitHub Copilot
extension was not installed, so config bytes and runtime loading were not
tested. Fixture provenance is `official-example-derived`.

## Unsupported or unknown

- Same-name precedence between workspace and profile MCP servers is unknown.
- Same-name skill precedence is unknown on the current official VS Code page.
- The physical user-instruction path varies by profile and must be resolved by
  VS Code; AMS must not manufacture a filesystem convention.
