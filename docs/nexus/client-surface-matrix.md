# Client and Surface Matrix

## Core conclusion

Different surfaces sometimes share a global config source, but this is not a universal harness invariant. AMS must model `Harness -> Surface -> ConfigSource[]` and verify each mapping.

| Harness | Surface evidence | Shared-source conclusion | MVP implication |
|---|---|---|---|
| Codex | App, CLI, and IDE extension share `~/.codex/config.toml` for MCP configuration on the same host. | Yes for this MCP source. | One resolved source with several consuming surfaces. |
| Kiro | IDE and CLI document `~/.kiro/settings/mcp.json` as the global MCP file; workspace configuration is separate. | Yes for global MCP, not proof that every capability uses one root. | Reuse the global MCP source; retain surface capability flags. |
| Kilo Code | CLI, VS Code, and JetBrains read the same JSONC configuration according to Kilo settings documentation. | Yes for the documented core configuration. | Parse once per resolved path and expose consuming surfaces. |
| GitHub Copilot | Copilot CLI uses `~/.copilot/mcp-config.json`; Copilot CLI documentation treats VS Code MCP configuration as a different format/location to migrate. | No universal shared source across CLI and VS Code. | Support both as distinct MVP surfaces with separate capabilities and bindings; manage only their user/global sources. |

## Source references

- [Codex MCP configuration](https://developers.openai.com/codex/mcp)
- [Kiro IDE MCP configuration](https://kiro.dev/docs/mcp/configuration/)
- [Kiro CLI MCP configuration](https://kiro.dev/docs/cli/mcp/configuration/)
- [Kilo settings](https://kilo.ai/docs/getting-started/settings)
- [Copilot CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
- [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)

## Adapter rule

An adapter declares:

- supported surfaces;
- resolved global sources per surface;
- precedence and ownership of each layer;
- readable and writable capabilities;
- format version evidence;
- lossy fields and round-trip guarantees.

A shared path is an optimization and relationship, not a reason to erase the surface model.
