# Product Charter

## Purpose

AgentMindStudio (AMS) is a local-first desktop control plane for understanding and deliberately changing global AI development configuration across multiple harnesses.

It solves four persistent problems:

- MCP, skills, instructions, and related settings are difficult to inspect as raw files.
- Moving between AI clients requires repeated manual configuration.
- A single client can have several config roots, layers, and precedence rules.
- The skills ecosystem exposes important workflows primarily through a CLI.

## Product promise

The user can answer three questions before any write:

1. What does each supported client currently have?
2. How and why do two clients differ?
3. Exactly what will change, and how can it be restored?

## MVP boundary

- Windows-first desktop app, with operating-system paths and process behavior behind portable interfaces.
- Global/user configuration only; no drive-wide project discovery.
- Harness scope: GitHub Copilot, Codex, Kiro, and Kilo Code.
- Read, compare, visualize, and manually apply reviewed changes.
- Structured UI is primary; Raw Config is an advanced escape hatch.
- skills CLI capabilities are exposed through a pinned and guarded process gateway.

## Explicit non-goals for MVP

- Continuous background reconciliation or automatic multi-client sync.
- Treating every difference as an error.
- Normalizing credentials across clients.
- Scanning repositories to manage project-scope configuration.
- Public auto-update infrastructure or team policy management.

## Success condition

AMS succeeds when a developer can migrate or reconcile a configuration intentionally without learning every client file format, while retaining client-specific differences and a reliable recovery path.
