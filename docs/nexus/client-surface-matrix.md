# Client and Surface Matrix

**Evidence review:** 2026-07-16. The verified source contract and its explicit
unknowns are in the [TG-003 evidence pack](../spikes/client-surface-config/README.md).
The machine-readable surface x artifact matrix is
[`surface-artifact-matrix.json`](../spikes/client-surface-config/surface-artifact-matrix.json).

## Core conclusion

Different surfaces sometimes share a global config source, but this is not a universal harness invariant. AMS must model `Harness -> Surface -> ConfigSource[]` and verify each mapping.

| Harness | Surface evidence | Shared-source conclusion | MVP implication |
|---|---|---|---|
| Codex | App, CLI, and IDE extension share `~/.codex/config.toml` for MCP configuration on the same host. | Yes for this MCP source. | One resolved source with several consuming surfaces. |
| Kiro | IDE and CLI document `~/.kiro/settings/mcp.json` as the global MCP file; workspace configuration is separate. | Yes for global MCP, not proof that every capability uses one root. | Reuse the global MCP source; retain surface capability flags. |
| Kilo Code | CLI, VS Code, and JetBrains read the same JSONC configuration according to Kilo settings documentation. | Yes for the documented core configuration. | Parse once per resolved path and expose consuming surfaces. |
| GitHub Copilot CLI | CLI uses `$COPILOT_HOME/mcp-config.json`, personal skill roots, and personal instruction files. | No shared MCP source with VS Code. Some personal skill roots may be consumed by both surfaces, but each relationship remains explicit. | Keep CLI capability, precedence, fixtures, and bindings separate. |
| GitHub Copilot in VS Code | VS Code resolves MCP and instruction files through the active user profile; personal skills include `~/.copilot/skills`, `~/.claude/skills`, and `~/.agents/skills`. | Profile MCP is distinct from CLI MCP. Profile-aware paths must be resolved rather than guessed. | Keep VS Code capability, profile source, fixtures, and bindings separate. |

## Verified user/global artifact sources

| Surface | MCP | Skill | Instruction/rule | Reload summary |
|---|---|---|---|---|
| Codex | `$CODEX_HOME/config.toml` (TOML) | `$HOME/.agents/skills/*/SKILL.md` | `$CODEX_HOME/AGENTS.override.md`, otherwise `AGENTS.md` | MCP IDE flow restarts the extension; skills auto-detect with restart fallback; instructions rebuild per run/session. |
| Kiro | `$KIRO_HOME/settings/mcp.json` (JSON) | `$KIRO_HOME/skills/*/SKILL.md` | `$KIRO_HOME/steering/*.md` | MCP is watched/reconnected; skill and steering refresh differs by IDE/CLI session as recorded in evidence. |
| Kilo | `$HOME/.config/kilo/kilo.jsonc` | `$HOME/.kilo/skills/*/SKILL.md` plus declared compatibility/additional roots | `instructions` references in global `kilo.jsonc` | Skills support `/reload`; instructions apply on the next interaction. |
| Copilot CLI | `$COPILOT_HOME/mcp-config.json` (JSON) | `$COPILOT_HOME/skills`, `$HOME/.agents/skills`, and declared roots | `$COPILOT_HOME/copilot-instructions.md` and `instructions/*.instructions.md` | `/mcp reload` exists; skill/instruction inventory is session-bound. |
| Copilot VS Code | Active-profile `mcp.json`, resolved by **MCP: Open User Configuration** | Personal `~/.copilot/skills`, `~/.claude/skills`, `~/.agents/skills` | Active-profile `*.instructions.md`, resolved by **Chat: Configure Instructions** | MCP configuration restarts affected servers; instructions apply on a later request. |

All instruction/rule rows are read-only in MVP. “Path exists” is not evidence
of writability. Unknown same-name precedence for VS Code MCP/skills and Kilo
additional roots remains explicit in the evidence matrix.

## Source references

- [Codex MCP configuration](https://developers.openai.com/codex/mcp)
- [Kiro IDE MCP configuration](https://kiro.dev/docs/mcp/configuration/)
- [Kiro CLI MCP configuration](https://kiro.dev/docs/cli/mcp/configuration/)
- [Kilo settings](https://kilo.ai/docs/getting-started/settings)
- [Copilot CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
- [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- [Copilot CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
- [VS Code MCP configuration](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Adapter rule

An adapter declares:

- supported surfaces;
- resolved global sources per surface;
- precedence and ownership of each layer;
- readable and writable capabilities;
- format version evidence;
- lossy fields and round-trip guarantees.

A shared path is an optimization and relationship, not a reason to erase the surface model.
