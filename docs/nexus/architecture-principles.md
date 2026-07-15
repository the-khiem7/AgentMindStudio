# Architecture Principles

## Stable core, replaceable edges

- Keep ElectronBun/ElectroBun shell details outside the domain model.
- Keep Windows path, process, credential, and atomic-write behavior behind platform ports so macOS implementations can be added later.
- Add clients through adapters; do not add client conditionals to shared synchronization services.
- Model surfaces even when they currently share a source.

## Parse, normalize, preserve

- Parse client-native formats into a normalized comparison model.
- Preserve unknown and client-only fields during round trips.
- Use capability declarations to prevent lossy writes.
- Keep live client files authoritative; never turn SQLite into a competing live config source.

## Guard every mutation

The write pipeline is: discover -> parse -> plan -> semantic diff -> confirm -> snapshot -> recheck -> atomic write -> reparse -> audit -> recover if needed.

## skills gateway

- Production pin: `skills@1.5.17` until a reviewed compatibility spike approves another version.
- Invoke through an argument-array child process, never a shell command string.
- Verify exact version and expected output shapes; exit code alone is insufficient.
- Stage mutating operations in an isolated environment before applying a separately reviewed filesystem plan.
- Convert process and contract failures into stable domain error codes for the UI.
- Keep the UI independent of human-oriented CLI text so the backend can later switch to a supported library or native implementation.

## UI delivery direction

Use design-generation tools such as Google Stitch for fast exploration and variants, then implement the accepted product UI with owned components. For this product, shadcn/ui is the leading implementation candidate because its source-owned components are easier to customize for dense diff and coverage workflows. Chakra UI remains viable if abstraction and speed matter more than fine-grained visual control.

This recommendation is not yet a closed decision.
