# skills CLI compatibility contract

## Production pin

- Package: `skills`
- Version: `1.5.17`
- Invocation: `npm exec --yes --package=skills@1.5.17 -- skills <args>`
- Integration boundary: child-process CLI wrapper, not JavaScript imports. The package does not expose a documented library API.

Changing the pin is a product decision. A newer version is not accepted until every required case passes in isolation and its output shapes have been reviewed.

## Required cases

| Case | Required observation |
|---|---|
| Binary identity | `--version` returns exactly the requested version |
| Root discovery | Root `--help` advertises `add`, `use`, `remove`, `list`, `find`, `update`, and `init` |
| Machine-readable inventory | `list --json` exits zero and parses as JSON |
| Local source discovery | `add <local-source> --list` discovers the fixture skill |
| Project install | `add <local-source> -a codex -s spike-skill --copy -y` succeeds inside the sandbox |
| Inventory after install | `list --json` remains parseable and exposes the installed fixture |
| Context use | `use <local-source> --skill spike-skill` succeeds |
| Project removal | `remove spike-skill -a codex -y` succeeds inside the sandbox |
| Invalid command | An unknown command prints `Unknown command`; in 1.5.17 it unexpectedly exits zero |

`update` is intentionally excluded from the safe automated contract until its dry-run behavior is independently proven. With `skills@1.5.17`, `update --help` performed a real global update.

## Known 1.5.17 hazards

- `npx --yes skills@1.5.17 ...` may be parsed as an npm command rather than invoking the package binary. Use the pinned `npm exec --package` form.
- Subcommand help is not consistently side-effect-free.
- `init --help` can create a skill literally named `--help`.
- Most mutation commands do not advertise structured JSON output. Treat their text output as diagnostic only and verify the resulting filesystem state.
- An unknown command can exit with code zero. Never use exit code as the only success signal.

## Failure taxonomy

| Code | UI message | Maintainer evidence |
|---|---|---|
| `SKILLS_CLI_NOT_FOUND` | Node/npm or the skills runner is unavailable. | executable lookup and spawn error |
| `SKILLS_CLI_VERSION_MISMATCH` | The installed runner does not match the supported version. | expected and observed version |
| `SKILLS_CLI_TIMEOUT` | The skills operation did not finish in time. | command, elapsed time, timeout |
| `SKILLS_CLI_NETWORK_FAILURE` | The package or remote skill source could not be reached. | sanitized stderr and exit code |
| `SKILLS_CLI_INVOCATION_FAILED` | The skills command failed. No user config was removed. | sanitized arguments, output, exit code |
| `SKILLS_CLI_OUTPUT_UNPARSEABLE` | The skills runner returned an unsupported response. | output sample and parser error |
| `SKILLS_CLI_CONTRACT_CHANGED` | This skills version is incompatible with AgentMindStudio. | failed contract cases and package version |
| `SKILLS_CLI_UNEXPECTED_WRITE` | The runner attempted to modify data outside its sandbox. | resolved paths and blocked operation |

The UI should offer: retry, open diagnostics, copy issue report, and cancel. It must not silently retry a mutation or automatically upgrade the pinned package.
