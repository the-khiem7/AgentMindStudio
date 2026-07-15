# TG-007 UI exploration record

**Status:** Proposed contract; human approval is outstanding  
**Gate:** TG-007  
**Owner:** Codex (UX lane)  
**Review date:** 2026-07-16  
**Product source:** [Project Nexus](../../nexus/README.md)  
**Canonical gate status:** [Technical readiness gates](../../baseline/agentmindstudio/agentmindstudio.technical-gates.md)

## Hypothesis

A single navigation model can make layer-aware discovery, client-neutral inventory, Coverage, semantic comparison, and deliberate mutation understandable without hiding target paths, credential preservation, or recovery behavior. The same model must make Instruction comparison visibly read-only and turn skills CLI contract failures into safe next actions.

## Exploration method and environment

- Environment: Windows desktop workspace on 2026-07-16.
- Source constraints: Nexus product charter, domain model, Diff UI specification, architecture principles, baseline acceptance journeys, and the TG-007 contract.
- Google Stitch was the preferred exploration surface, as required by the Nexus.
- The available browser runtime reported no browser backends, so Google Stitch could not be opened or exported in this run.
- Equivalent local evidence was produced as an inspectable [HTML prototype](prototype.html), a consolidated [PNG storyboard](exports/tg007-flow-board.png) with an [editable SVG export](exports/tg007-flow-board.svg), and an [Apply Sheet render](exports/prototype-apply.png). These are disposable design artifacts, not production UI source.
- Maintained production UI remains owned shadcn/ui-based components; the proposed ownership mapping is recorded in [shadcn-ui-mapping.md](shadcn-ui-mapping.md).

No application code, client configuration, filesystem mutation workflow, or package operation was executed by this exploration.

## Information architecture proposal

```text
Overview
Clients
Inventory
  MCP servers
  Skills
  Instructions (Read-only)
Coverage
Skills catalog
Activity
Settings
```

The persistent shell exposes scan health and read-only state. **Coverage** is the primary cross-client comparison entry point. Selecting a row or matrix cell opens comparison; it never applies a repair. Mutating MCP and Skill actions progress through a plan and final Apply drawer. Instruction routes terminate at comparison.

## Required-flow coverage

| TG-007 flow | Prototype view | Static export panel | Status |
|---|---|---|---|
| First-run discovery and surface/layer health | `#first-run` | 01 | Proposed |
| Unified inventory and Coverage matrix | `#coverage` | 02 | Proposed |
| Same-name/different-endpoint conflict | `#name-collision` | 03 | Proposed |
| Different-name/same-endpoint alias linking | `#alias-link` | 04 | Proposed |
| Raw plus semantic Diff | `#diff` | 05 | Proposed |
| Apply drawer with exact paths, credentials, snapshot, rollback | `#apply` | 06 | Proposed |
| skills CLI incompatibility/error state | `#skills-error` | 07 | Proposed |
| Read-only Instruction comparison | `#instruction-readonly` | 08 | Proposed |

Detailed acceptance observations and product-invariant checks are in [flow-acceptance.md](flow-acceptance.md). Accessibility findings are in [accessibility-review.md](accessibility-review.md).

## Proposed contract decisions

These are recommendations awaiting human approval; they are not closed product decisions.

1. Use one persistent desktop shell and breadcrumb trail so the user retains client, surface, layer, and artifact context.
2. Make the initial experience a read-only scan with explicit surface cards and expandable layer health, not an onboarding wizard that requests writes.
3. Use a semantic HTML table for Coverage at MVP scale. Each state includes text and an icon; color is supplemental.
4. Treat matrix cells and rows as comparison entry points. A missing MCP or Skill binding may offer **Review sync plan** only after selection; Instruction cells never do.
5. Keep conflict resolution beside the semantic explanation. Disable impossible actions with an adjacent reason instead of silently omitting them.
6. Make Raw and Semantic views peers in one comparison screen, defaulting to Semantic and redacting raw values.
7. Use a right-side desktop Sheet for the final Apply review, with paths, scope, preserved credential bindings, warnings, snapshot, rollback, and explicit Apply/Cancel.
8. Give operational errors a stable four-part structure: failure, protection/recovery outcome, known cause, and safe next actions.
9. Display a persistent **Read-only** badge and an explanatory callout on every Instruction detail/compare view; omit all mutation affordances.

## Approval boundary and limitations

TG-007 remains `in_progress` because the pass condition requires accepted prototypes and recorded approval. This evidence covers every required flow but has not been reviewed or accepted by a product owner. Google Stitch-specific visual exploration is also outstanding because the browser surface was unavailable.

Production Dashboard/Coverage/Diff implementation remains blocked by TG-007 approval plus the relevant read services. No roadmap or Nexus status was changed by this spike.

## Reviewer checklist

- [ ] Approve or revise the information architecture.
- [ ] Approve the eight flow contracts in [flow-acceptance.md](flow-acceptance.md).
- [ ] Approve the desktop Apply Sheet pattern and warning hierarchy.
- [ ] Confirm the Instruction read-only affordance boundary.
- [ ] Confirm the Coverage keyboard model and state vocabulary.
- [ ] Approve the shadcn/ui ownership mapping.
- [ ] Record approval evidence, then update TG-007 to `passed` only if every pass condition is met.
