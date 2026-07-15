# Diff UI Specification

## Coverage screen

```text
MCP server          Copilot          Codex            Kiro             Kilo          State
------------------------------------------------------------------------------------------------
filesystem          Present          Present          Missing          Present       Coverage gap
postgres            prod-db          prod-db          prod-db          prod-db        Name collision
context7            context7         context-7        context7         Missing        Linked aliases
```

Selecting a cell opens comparison; it never applies a repair immediately.

## Same name, different endpoint

```text
Conflict: Name collision                                      [Raw | Semantic]

                       Copilot                         Codex
Name                   prod-db                         prod-db
Transport              http                            http
Endpoint             - https://mcp-a.example.com     + https://mcp-b.example.com
Credential profile     copilot-prod (preserved)        codex-prod (preserved)

Why this is a conflict
The aliases match, but the endpoint fingerprints identify different servers.

[Keep both] [Rename one binding] [Use Copilot endpoint in Codex] [Use Codex endpoint in Copilot]
```

`Link aliases` is disabled because the endpoints are different. Endpoint replacement requires a target-specific preview and never replaces the credential profile automatically.

## Different names, same endpoint

```text
Possible aliases                                              [Raw | Semantic]

                       Copilot                         Kiro
Name                   context7                        context-7
Endpoint                https://mcp.context7.com        https://mcp.context7.com
Fingerprint             8f21...                         8f21...
Credential profile      copilot-default                 kiro-default

[Link as one logical MCP] [Keep separate] [Rename target alias]
```

Linking creates one logical asset with two native aliases. It does not rewrite either file unless the user separately chooses Rename.

## Apply drawer

Every mutating action opens a final drawer containing:

- selected domain operation;
- exact surfaces, layers, and resolved paths;
- semantic changes and raw diff;
- preserved credential bindings;
- compatibility/loss warnings;
- snapshot location and rollback behavior;
- explicit **Apply** and **Cancel** actions.
