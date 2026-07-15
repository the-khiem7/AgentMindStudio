---
name: spike-skills-cli
description: Safely verify the pinned skills CLI contract in an isolated Windows environment. Use when upgrading the skills package, changing the AgentMindStudio wrapper, investigating an incompatibility warning, or rerunning the npx skills integration spike.
---

# Spike Skills CLI

Verify the exact CLI contract AgentMindStudio depends on without reading from or writing to the developer's real global skill directories.

## Workflow

1. Read [references/contract.md](references/contract.md) before running any command.
2. Run the spike from the repository root:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .agents/skills/spike-skills-cli/scripts/run-spike.ps1
   ```

3. Pass `-Version <version>` only when evaluating an intentional upgrade. The committed default is the product's pinned version.
4. Inspect the generated `results.json`. Treat any failed case or contract warning as an incompatible CLI, even if the process exited successfully.
5. Record changed behavior in `docs/spikes/skills-cli/` and update the Nexus decision register before changing the production pin.

## Safety Rules

- Never run mutating skills commands against the real `HOME`, `USERPROFILE`, or project root during a spike.
- Never probe a subcommand by appending `--help`. In `skills@1.5.17`, some subcommands execute instead of displaying help.
- Invoke the pin with `npm exec --yes --package=skills@<version> -- skills ...`. Do not use the ambiguous `npx skills@<version>` form.
- Verify the binary's exact version before testing other commands.
- Keep credentials and environment values out of captured output.
- Fail closed on timeouts, unparsable JSON, unexpected command shapes, version mismatches, or writes outside the sandbox.

## Interpreting Results

- `pass`: observed behavior matches the pinned contract.
- `fail`: a required capability is broken; do not update the production pin.
- `warning`: behavior is usable but not stable enough for unattended UI operations.

When a failure occurs, preserve the report path and map it to the user-facing error taxonomy in the contract reference. The UI should explain that the skills integration is incompatible and provide diagnostics for maintainers; it must not suggest deleting user configuration.

## Resources

- `scripts/run-spike.ps1`: repeatable isolated compatibility runner.
- `references/contract.md`: required commands, known hazards, and UI-facing failure taxonomy.
