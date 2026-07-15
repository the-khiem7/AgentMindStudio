# TG-007 accessibility review

**Review type:** Design-contract review of the local prototype and proposed production mapping  
**Status:** Proposed fixes incorporated into the contract; production verification remains outstanding

## Keyboard navigation

| Area | Proposed interaction | Review outcome |
|---|---|---|
| Application shell | Skip link, then primary navigation, page context, and main content | Required in production. Current HTML prototype includes a skip link and landmarks. |
| Surface/layer health | Tab to surface summary; Enter/Space expands; details follow in DOM order | Acceptable proposal. Do not make the entire card a nested interactive target. |
| Coverage matrix | Tab enters the table; arrow keys move among actionable cells; Enter opens comparison; Home/End move within row; Ctrl+Home/End move to table bounds | Required custom behavior for the owned `CoverageMatrix`; provide a plain table fallback for screen readers. |
| Diff | Tab reaches view toggles and section actions; raw diff remains readable without horizontal keyboard traps | Acceptable proposal; Scroll Area must not capture arrow keys when focus is on controls. |
| Apply Sheet | Initial focus on heading or first warning; Tab remains trapped; Cancel precedes Apply; Escape closes only before execution; focus returns to trigger | Required production test. |
| Error state | Heading receives programmatic focus after route/dialog transition; actions follow the four-part explanation | Acceptable proposal. |

## Focus order and visibility

- The visual and DOM order must match: breadcrumb/title, status/context, primary content, then contextual actions.
- Use `:focus-visible` with a high-contrast outline and offset; never remove the browser focus indicator without a replacement.
- Disabled actions remain discoverable with adjacent explanatory text. A disabled control must not be the sole carrier of its explanation.
- Route changes and opened comparisons move focus to the new `h1`; closing dialogs/sheets restores focus to the invoking control.
- Loading and scan completion use polite live regions. Blocking errors use assertive announcement only once.

## Non-color state indicators

Every state uses icon, short text, and accessible name. Proposed vocabulary:

| State | Text | Supplemental symbol |
|---|---|---|
| Present | Present | check |
| Missing | Missing | dash |
| Linked alias | Linked aliases | link |
| Conflict | Name collision | warning triangle |
| Incompatible | Incompatible | blocked circle |
| Intentional override | Intentional override | pin |
| Read-only | Read-only | lock |

Raw diff lines use `+ Added`, `− Removed`, and `~ Changed` text in addition to color and background. Credential differences use **Different bindings — values redacted**, not two colored secret values.

## Redacted values

- Preserve non-secret identity such as variable/header name while replacing the value with `••••••••`.
- Screen-reader text should say “Redacted value” and, where relevant, “binding differs”; it must not read punctuation as if it were the value.
- Copy actions copy a redacted diagnostic representation by default.
- Raw views are redacted by default. Instruction views expose no Raw Config write mode.
- A reveal control, if later approved, requires a distinct advanced interaction and must never reveal multiple values merely to compare them.
- Accessible names, DOM attributes, telemetry, diagnostics, and clipboard payloads must not contain hidden secret values.

## Contrast, density, and zoom

- Production tokens must meet WCAG AA contrast for text and interactive states; badges cannot depend on pale background tint alone.
- Dense tables retain at least a 32 px row target and 44 px primary action target where layout permits.
- At 200% zoom, Coverage may scroll horizontally but the artifact row header and state legend remain understandable.
- At 400% zoom or narrow width, comparison columns stack with explicit surface headings; no information is conveyed only by spatial left/right position.

## Open production verification

- Automated axe scan of every accepted flow.
- Manual keyboard-only pass including matrix arrow-key behavior and focus restoration.
- Screen-reader pass for table headers, redaction labels, errors, and Apply Sheet warnings.
- Forced-colors/high-contrast mode check.
- 200%/400% zoom and text-spacing check.
- Confirm that no secret value enters accessible names, DOM snapshots, logs, or copied diagnostics.

These checks cannot be marked verified until owned production components exist. They do not block UX contract review, but they remain acceptance requirements for implementation.
