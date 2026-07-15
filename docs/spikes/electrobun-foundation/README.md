# TG-001 ElectroBun Foundation Prototype

This directory contains the disposable, repeatable prototype for TG-001. It is evidence code, not the AgentMindStudio production scaffold.

The runner copies `prototype/` into a GUID-named child of the Windows temp directory, installs only the pinned lockfile, runs the primitives directly under Bun, builds both the retained dev Windows bundle and the stable installer artifacts, runs the same primitives through the packaged dev launcher without elevation, and removes only the verified temp child. Stable packaging consumes its intermediate app bundle into installer/archive artifacts, so the retained dev bundle is used for the packaged-runtime execution check.

ElectroBun `1.18.1` currently invokes Windows PowerShell `Compress-Archive` for the stable installer zip. The runner applies `PSExecutionPolicyPreference=Bypass` only to the build process environment because Windows PowerShell may otherwise select a PowerShell 7 archive module that it refuses to load. The runner restores the previous value immediately after the build and does not change user or machine policy.

Run from the repository root:

```powershell
pwsh -NoProfile -File docs/spikes/electrobun-foundation/run.ps1
```

To persist a machine-readable report, pass an output path:

```powershell
pwsh -NoProfile -File docs/spikes/electrobun-foundation/run.ps1 -EvidencePath docs/spikes/electrobun-foundation/runs/<run-id>/results.json
```

The prototype verifies:

- bounded read/write in paths containing spaces and Unicode;
- same-directory temporary write, flush, atomic replacement, exclusive lock contention, and cleanup;
- argument-array child processes with distinct stdout/stderr, exit-code preservation, allowlisted environment, timeout, and cancellation;
- SQLite migration, transaction rollback, close/reopen persistence, malformed-database failure, and cleanup;
- execution under a non-elevated token in both source and packaged modes.
