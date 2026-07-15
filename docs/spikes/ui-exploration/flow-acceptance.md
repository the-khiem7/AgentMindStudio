# TG-007 flow-level acceptance notes

**Evidence state:** Proposed; awaiting human approval  
**Prototype:** [Interactive flow prototype](prototype.html)  
**Storyboard:** [Eight-flow PNG export](exports/tg007-flow-board.png) ([SVG source](exports/tg007-flow-board.svg))  
**Rendered example:** [Final Apply Sheet](exports/prototype-apply.png)

These notes translate the Nexus and baseline acceptance journeys into screen-level contracts. “Accept” below means the future reviewer should verify the behavior; it does not claim that a reviewer has accepted it.

## UX-FLOW-01 — First-run discovery and surface/layer health

**Entry:** First launch or **Scan now** from Overview.  
**Outcome:** The user can identify each supported surface and inspect its global/user layers without any write.

Acceptance checks:

- Start in clearly labelled **Read-only scan** mode; no client file is created, changed, or tested through a process/network call.
- List Copilot CLI, Copilot VS Code, Codex, Kiro, and Kilo independently.
- Use the status vocabulary: Ready, Detected not configured, Partially readable, Unsupported or unverified version, Permission blocked, and Not detected.
- Expanding a surface exposes layer path, format, ownership, precedence, writability, confidence, and reload behavior.
- Scan progress is cancellable. Completion summarizes readable, warning, and blocked surfaces and links to diagnostics without exposing source content.
- Keyboard order is scan action, surface summary, then expanded layer details. Status includes text and icon, not color alone.

## UX-FLOW-02 — Unified inventory and Coverage matrix

**Entry:** **Inventory** or **Coverage** in primary navigation.  
**Outcome:** The user understands where an artifact is present, missing, related, conflicting, incompatible, or intentionally different.

Acceptance checks:

- Inventory filters client/surface, artifact type, layer, status, and compatibility while preserving a client-neutral logical-asset row.
- Coverage columns distinguish Copilot CLI from Copilot VS Code and also include Codex, Kiro, and Kilo.
- Cell states expose icon plus text: Present, Missing, Linked alias, Conflict, Incompatible, and Intentional override.
- Row/cell activation opens comparison; Coverage itself never applies or removes configuration.
- A missing MCP or Skill binding may offer **Review sync plan** after target selection. No target is selected silently.
- Credential-binding difference is separate from structural difference and is never presented as an automatic repair.
- Instruction missing/different states open comparison only.

## UX-FLOW-03 — Same name, different endpoint

**Entry:** Select a **Name collision** Coverage cell or inventory relation.  
**Outcome:** The user understands that matching aliases do not prove matching identity.

Acceptance checks:

- Show both bindings side by side with surface, alias, transport, normalized endpoint/command fingerprint, layer, and preserved credential profile.
- Explain that endpoint fingerprints differ and therefore alias linking is unavailable.
- Offer **Keep both**, **Rename one binding**, **Use left endpoint in right**, and **Use right endpoint in left** only where adapter capabilities allow them.
- Endpoint replacement creates a target-specific preview and does not copy or replace credentials automatically.
- A disabled **Link aliases** action includes the reason “Endpoints identify different MCP servers.”

## UX-FLOW-04 — Different name, same endpoint

**Entry:** Select a **Linked alias candidate** relation.  
**Outcome:** The user can link two native aliases as one logical MCP without rewriting either file.

Acceptance checks:

- Show different aliases, matching endpoint fingerprint, client-specific credential profiles, and source layers.
- Offer **Link as one logical MCP**, **Keep separate**, and **Rename target alias**.
- Explain that linking changes AMS metadata only; native files are unchanged unless Rename is separately planned.
- Confirmation enumerates the two bindings and retains both aliases.
- Link state is represented by link icon plus **Linked aliases** text.

## UX-FLOW-05 — Raw plus semantic Diff

**Entry:** Select a comparable Coverage row/cell, inventory item, or planned operation.  
**Outcome:** The user can understand line-level and domain-level differences before choosing an action.

Acceptance checks:

- Provide **Semantic** and **Raw** tabs plus side-by-side/unified view controls.
- Semantic sections cover endpoint/command, arguments, enabled state, credential binding, client-only fields, compatibility/loss, and source layer.
- Raw diff shows line numbers and signs; redacted values retain labels such as “value differs — redacted.”
- Difference indicators include symbols and text; insertions/deletions do not rely on green/red alone.
- A CredentialBindingDifference defaults to **Preserve target binding**.
- Comparison is non-mutating; the next step is **Review plan**, never immediate Apply.

## UX-FLOW-06 — Final Apply drawer

**Entry:** An MCP or Skill plan has been generated and reviewed.  
**Outcome:** The user can confirm exactly what changes, what remains protected, and how recovery works.

Acceptance checks:

- Show selected domain operation and exact target surfaces, layers, and resolved paths.
- Show semantic summary and link to raw diff, preserved credential bindings, compatibility/loss warnings, and reload guidance.
- State that a snapshot is created immediately before change; expose snapshot destination policy and rollback behavior.
- Show external-change recheck and post-write reparse/validation as steps in the operation.
- **Cancel** is available before **Apply** in focus order. **Apply** is disabled until required warnings/target confirmations are acknowledged.
- Focus is trapped while open, Escape cancels only before execution, and close restores focus to **Review plan**.
- Applying never occurs from the Coverage matrix or Diff screen without this final review.

## UX-FLOW-07 — skills CLI incompatibility/error

**Entry:** skills gateway detects a version/output contract mismatch, prerequisite failure, timeout, network error, or cancellation.  
**Outcome:** The user knows what failed, what was protected, why it failed, and the safe next action.

Acceptance checks:

- Title identifies the stable category, for example **Skills runner incompatible**.
- Protection summary states that no target files changed, or reports the exact recovery result when an operation had started.
- Cause shows expected pin (`skills@1.5.17`) and sanitized observed contract; no full environment, token, raw source, or stack trace appears by default.
- Actions are **Retry check**, **Open diagnostics**, **Copy issue report**, and **Cancel** as applicable.
- Diagnostics export is redacted and excludes configuration content by default.
- A zero process exit with unexpected output remains an error; the screen never equates exit code zero with compatibility.

## UX-FLOW-08 — Read-only Instruction comparison

**Entry:** Inventory > Instructions or an Instruction Coverage cell.  
**Outcome:** The user can inspect activation and precedence differences without any mutation affordance.

Acceptance checks:

- Persistent **Read-only** badge appears in breadcrumb/title context and beside the comparison heading.
- Show source surface/layer, precedence, activation semantics, compatibility, and redacted raw/semantic differences.
- Explain unsupported representation in plain language, including why semantic equivalence may not be possible.
- Expose no create, edit, sync, remove, conversion, Apply, or Raw Config write action.
- Safe actions are limited to navigation, filtering, copying a redacted diagnostic summary, and opening the source location when permitted.
- Keyboard and screen-reader users encounter the read-only explanation before comparison content.

## Cross-flow invariants

- Exact surface and layer context is never collapsed into harness-only labels.
- Project scope is not discovered or offered as a mutation target.
- Live client files remain authoritative; the UI describes observed state and explicit plans.
- Every mutation path is target-selected, dry-run reviewed, credential-preserving by default, snapshotted, externally rechecked, reparsed, and audited.
- Instruction/rule support remains read-only throughout MVP.
- No default UI reveals secret values; difference can be communicated without disclosure.
- All actionable errors answer: what failed, what was protected/restored, known cause, and safe next action.

## Approval record

No approval evidence exists yet. A reviewer should append reviewer identity, date, prototype revision/commit, accepted flows, requested revisions, and outcome here before the TG-007 gate can pass.
