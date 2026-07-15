# Kilo surface evidence

Reviewed: 2026-07-16  
Surface ID: `kilo` (`cli`, `vscode`, and `jetbrains` consumers)  
Scope: user/global, read-only evidence

## Verified source contract

| Artifact | User/global source | Format and signal | Ownership / precedence | Reload |
|---|---|---|---|---|
| MCP | `$HOME/.config/kilo/kilo.jsonc` (or existing `.json` form) | JSONC top-level `mcp`; detected client version, no file-level schema version | User owned. Project `kilo.jsonc` or `.kilo/kilo.jsonc` wins over global. | Shared CLI-server clients observe config changes; AMS advises reconnect/reload if stale. |
| Skill | `$HOME/.kilo/skills/*/SKILL.md`, compatibility roots, and declared `skills.paths` | Directory plus Agent Skills frontmatter | User owned. Project `.kilo/skills` wins over same-name global skill. Tie behavior across compatibility/additional roots is unknown. | New session or `/reload`. |
| Instruction | `instructions` array in global `kilo.jsonc`, referencing Markdown paths/globs | JSONC references plus Markdown | User owned, read-only in MVP. Global instructions load before project instructions; array order and filesystem order for globs are meaningful. | Applies on the next interaction. |

The core JSONC file is shared by Kilo CLI, VS Code, and JetBrains. The skill
root is separate, so AMS models both config sources even though the consuming
surface set is the same.

## Official evidence

- [Kilo settings](https://kilo.ai/docs/getting-started/settings) documents the
  Windows global JSONC path and shared CLI/VS Code/JetBrains consumption.
- [Kilo MCP](https://kilo.ai/docs/automate/mcp/using-in-kilo-code) documents
  the `mcp` shapes and project-over-global precedence.
- [Kilo skills](https://kilo.ai/docs/customize/skills) documents the global
  root, compatibility/additional paths, project precedence, and `/reload`.
- [Kilo custom rules](https://kilo.ai/docs/customize/custom-rules) documents
  the `instructions` array, global/project order, glob order, and
  next-interaction activation.

## Sanitized local verification

The [metadata-only report](runs/20260716-ams-windows/results.json) observed Kilo
CLI `7.3.21`, Kilo VS Code extension `7.4.7`, and a regular global JSONC file.
The primary `$HOME/.kilo/skills` root was absent, which is a valid empty state.
No JetBrains installation was probed because the host probe has no stable,
officially declared installation command; the shared-source claim comes from
official documentation.

## Unsupported or unknown

- If both global `kilo.json` and `kilo.jsonc` exist, the official pages do not
  define a durable winner; discovery must report ambiguity.
- Tie order across compatibility and additional skill paths is unknown.
- A missing instruction reference is an adapter warning; client error severity
  is not claimed.
