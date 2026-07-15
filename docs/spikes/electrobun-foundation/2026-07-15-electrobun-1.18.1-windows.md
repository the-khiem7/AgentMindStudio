# ElectroBun 1.18.1 Windows Foundation Spike

## Outcome

**TG-001 passed on 2026-07-15.** The required filesystem, process, SQLite, and no-elevation primitives passed both under the source Bun runtime and through an ElectroBun-packaged Windows launcher. ElectroBun also completed stable Windows installer/archive packaging.

Recommendation: proceed with the ElectroBun production scaffold and implement these primitives directly behind Windows platform ports. No native helper or framework reconsideration is required for the tested contract. Keep the two build/lifecycle limitations below explicit in the scaffold work.

## Environment and exact versions

| Component | Verified value |
|---|---|
| ElectroBun | `1.18.1` |
| Bun | `1.3.13` (`bf2e2cec`) |
| SQLite linked by Bun | `3.51.2` |
| Windows | Microsoft Windows 11 Pro `10.0.22631`, build `22631`, AMD64 |
| Node.js used by the runner | `v24.13.1` |
| npm used by the runner | `11.8.0` |
| Elevation | `false` in source and packaged probes |

The package and types are locked in [`prototype/bun.lock`](prototype/bun.lock). The stable ElectroBun package was verified from npm before the run; the upstream project declares Windows 11+ official support and uses Bun as the main-process runtime.

## Method

The repeatable [`run.ps1`](run.ps1) runner:

1. verifies that the host PowerShell token is not elevated;
2. copies [`prototype/`](prototype/) to a GUID-named child of the Windows temp directory;
3. installs the committed lockfile with `bun install --frozen-lockfile`;
4. runs the primitive probe directly under Bun;
5. builds a retained ElectroBun dev Windows bundle and stable installer artifacts;
6. runs the same probe through the packaged `launcher.exe`;
7. captures a machine-readable result and SHA-256 for the packaged launcher;
8. recursively removes only a path verified to be a child of the temp root.

The probe uses Bun's documented argument-array `Bun.spawn` API with separate streams, timeouts, `AbortSignal`, and an explicit child environment. It uses the built-in `bun:sqlite` driver, which is supported in compiled/packaged Bun applications on Windows.

## Verification results

| Required primitive | Source | Packaged | Evidence |
|---|---:|---:|---|
| Bounded read/write under a declared root with spaces and Unicode | Pass | Pass | Unicode round-trip succeeded; `..` escape was rejected. |
| Temporary write and atomic replacement | Pass | Pass | Same-directory `wx` temp file was flushed, renamed over the target, and removed. |
| Lock/error behavior and cleanup | Pass | Pass | Second exclusive lock creation returned `EEXIST`; release, reacquire, and cleanup succeeded. |
| Argument-array child execution | Pass | Pass | Space and Unicode arguments were preserved; exit code `7` was preserved. |
| Separate stdout/stderr and sanitized environment | Pass | Pass | Distinct markers were captured; allowlisted value passed and secret sentinel did not leak. |
| Timeout | Pass | Pass | Child was killed with exit `137` in 270 ms source / 259 ms packaged. |
| Cancellation | Pass | Pass | `AbortSignal` killed the child with exit `137` in 358 ms source / 273 ms packaged. |
| SQLite open and migration | Pass | Pass | Schema migration and durable migration row succeeded. |
| SQLite transaction rollback | Pass | Pass | Intentional failure left zero inserted asset rows. |
| SQLite close/reopen and failure behavior | Pass | Pass | Reopen preserved schema; malformed database was rejected. |
| Packaged execution without elevation | N/A | Pass | Packaged probe reported `elevated: false`. |
| Stable Windows packaging | N/A | Pass | Setup executable, archive, metadata, zip, and update artifacts were generated. |

Machine-readable evidence: [`runs/20260715-174500/results.json`](runs/20260715-174500/results.json).

## Behavioral hazards and limitations

### Stable packaging invokes Windows PowerShell archive code

ElectroBun `1.18.1` invokes Windows PowerShell `Compress-Archive` while producing the stable installer zip. On this host, Windows PowerShell inherited a module path that selected the PowerShell 7 archive module and refused to load it under the default execution policy.

The runner sets `PSExecutionPolicyPreference=Bypass` only in the build process environment, restores the previous value immediately afterward, and changes neither user nor machine policy. With that bounded workaround, stable packaging completed without elevation. Production build automation must preserve this workaround or replace the zip step with an owned packaging port.

### Headless launcher supervision

The packaged probe wrote a complete passing result, but the native launcher remained alive after the headless Bun entrypoint exited. The runner waited for the evidence file, allowed five seconds for natural exit, then terminated the launcher process tree. Normal production UI lifecycle was not evaluated by this headless spike. Scaffold work should add an explicit launcher/window shutdown test; this behavior does not invalidate the required primitives.

### Scope limits

- The spike did not install the generated stable setup executable or test signed distribution/update flows.
- Credential-store access was not required by TG-001 and remains a future platform-port concern.
- Symlink/junction threat handling belongs to TG-006; this spike verifies lexical root bounds and guarded cleanup only.
- UI/WebView behavior belongs to TG-007 and was not exercised.

## Side effects

- The final run created build artifacts only under a verified GUID-named temp child and removed that child.
- No elevation, installer execution, machine/user execution-policy change, registry mutation, or production scaffold was performed.
- Network access downloaded the pinned npm packages and ElectroBun `1.18.1` Windows core archive.

## Sources

- [ElectroBun repository and platform support](https://github.com/blackboardsh/electrobun/tree/v1.18.1)
- [Bun child-process contract](https://bun.sh/docs/runtime/child-process)
- [Bun SQLite contract](https://bun.sh/docs/runtime/sqlite)
- [Bun single-file executable and SQLite support](https://bun.sh/docs/bundler/executables)

## Invalidation triggers

Rerun this spike when the ElectroBun or Bun major version changes, the packaging/runtime is replaced, a new native primitive becomes required, the stable packaging command changes, or the Windows execution-policy/module environment used by release builds changes.
