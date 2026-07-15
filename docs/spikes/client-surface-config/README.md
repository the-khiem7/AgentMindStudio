# TG-003 client surface configuration evidence

Reviewed: 2026-07-16 (Asia/Saigon)

This spike verifies the user/global sources that AgentMindStudio may inspect for
the MVP. It does not authorize writes. Project, organization, managed, runtime,
authentication, cache, and session sources are recorded only when needed to
explain precedence; they remain outside the discovery boundary.

## Artifacts

- `surface-artifact-matrix.json` is the machine-readable surface x artifact
  contract.
- `codex.md`, `kiro.md`, `kilo.md`, `copilot-cli.md`, and
  `copilot-vscode.md` are the evidence records required by TG-003.
- `probe.ps1` performs a metadata-only local probe. It never reads config
  bytes, filenames below skill/instruction roots, environment values, or auth
  state.
- `runs/20260716-ams-windows/results.json` is the sanitized local report.

## Repeat local verification

```powershell
pwsh -NoProfile -File docs/spikes/client-surface-config/probe.ps1 `
  -OutputPath docs/spikes/client-surface-config/runs/<timestamp>/results.json
```

The output uses path tokens such as `$HOME/.codex/config.toml`; it never emits
the resolved user profile. A missing client is evidence about this test host,
not evidence that the surface is unsupported.

## Evidence boundary

Official documentation establishes path/discovery rules, formats, precedence,
and reload behavior. The local probe establishes only whether a documented
command or candidate source exists on the reviewed Windows host. Where official
documentation does not define a deterministic precedence or reload rule, the
matrix says `unknown`; adapters must not invent one.

## Verification

Run the fixture contract and secret scan from the repository root:

```powershell
pwsh -NoProfile -File fixtures/clients/verify.ps1
```

The verifier cross-checks every matrix row whose `read` value is `supported`
against a fixture manifest, validates positive/failure cases and expected
normalized JSON, verifies scenario coverage, and scans the fixture pack for
credential-like material.
