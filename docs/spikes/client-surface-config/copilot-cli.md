# GitHub Copilot CLI surface evidence

Reviewed: 2026-07-16  
Surface ID: `copilot-cli`  
Scope: user/global, read-only evidence

## Verified source contract

| Artifact | User/global source | Format and signal | Ownership / precedence | Reload |
|---|---|---|---|---|
| MCP | `$COPILOT_HOME/mcp-config.json`; default `$HOME/.copilot/mcp-config.json` | JSON `mcpServers`; no file-level schema version | User owned. Additional flag > plugin > workspace/repository > user. | `/mcp reload`, `/restart`, or a new session after direct edits. |
| Skill | `$COPILOT_HOME/skills`, `$HOME/.agents/skills`, and declared custom roots | Directory plus Agent Skills frontmatter | User owned for the listed global roots. Project/inherited sources precede personal, plugin, built-in, and remote sources in the documented search order. | Start/restart a session; `/env` verifies loaded skills. |
| Instruction | `$COPILOT_HOME/copilot-instructions.md` and `$COPILOT_HOME/instructions/*.instructions.md` | Markdown | User owned, read-only in MVP. Personal instructions apply to all sessions; repository sources can also load, and conflicts are not promised deterministic resolution. | Exit and resume or start a new session. |

## Official evidence

- [CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
  documents `COPILOT_HOME`, user-editable MCP, skills, and instruction sources.
- [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
  documents MCP shape, source priority, skill search order, `/mcp reload`,
  `/restart`, and `/env`.
- [CLI custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)
  documents personal instruction reload behavior.

## Sanitized local verification

The [metadata-only report](runs/20260716-ams-windows/results.json) did not find
the `copilot` command or any default Copilot CLI user source. This is a valid
not-installed state, not a support failure. Fixture provenance for this surface
is therefore `official-example-derived`, not locally captured.

## Unsupported or unknown

- Local client-version behavior could not be exercised on this host.
- No write or round-trip preservation claim is made.
- The CLI user MCP file is distinct from VS Code profile MCP configuration.
