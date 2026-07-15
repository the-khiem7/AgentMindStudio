# TG-002 Adapter Contract Proof

## Purpose

Compile and exercise contract version `1.0.0` with two structurally different proof adapters:

- Codex: shared TOML source consumed by CLI, desktop, and IDE surfaces.
- Kilo: shared JSONC source consumed by CLI, VS Code, and JetBrains surfaces.

The proof demonstrates contract extensibility and safety invariants. It does not claim that all client paths, schemas, precedence rules, or write behaviors have passed TG-003/TG-004.

## Run

From the repository root:

```powershell
pwsh -NoProfile -File docs/spikes/adapter-contract/run.ps1 `
  -EvidencePath docs/spikes/adapter-contract/runs/<timestamp>/results.json
```

The runner uses the host's installed Node.js, npm/npx, and TypeScript. It compiles into a GUID-named child of the Windows temp directory, runs the proof, optionally writes the JSON evidence file, and removes only the verified temp child.

## Files

- `src/contract.ts`: versioned interface, capability schema, validator, and error taxonomy.
- `src/proof-adapters.ts`: Codex and Kilo implementations of the same contract.
- `src/verify.ts`: condition-free registry proof and invariant checks.
- `tsconfig.json`: strict compile settings.
- `run.ps1`: repeatable isolated runner.

## Expected result

The JSON result has `status: "pass"` and reports checks for compilation, shared-source surface preservation, deterministic pure-method output, capability validation, instruction read-only enforcement, condition-free registry orchestration, and secret-safe errors.
