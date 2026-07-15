# AgentMindStudio Agent Instructions

## Documentation

### Documentation hierarchy

Use this hierarchy for all product and engineering documentation:

```text
Project Nexus
    -> governs
Baseline Packs
    -> decomposed and justified by
ADR / Spikes
    -> implemented and verified by
Code & Tests
```

Each level answers a different question:

1. **Project Nexus — What and why**
   - Stores durable product intent, domain language, scope boundaries, invariants, architecture principles, capabilities, and Nexus-level decisions.
   - Lives in `docs/nexus/`.
   - Is the authority for what the product should be.
   - Changes only through an explicit product decision. Implementation work must not silently redefine it.

2. **Baseline Packs — Current feature/workstream state**
   - Store current requirements, roadmap, planned or implemented behavior, user journeys, technical baseline, assumptions, and decision status for one bounded workstream.
   - Live in `docs/baseline/<workstream>/`.
   - Inherit Nexus intent and may make it more specific, but must not contradict or override Nexus invariants.
   - Must distinguish planned behavior from verified implementation.

3. **ADR / Spikes — Rationale and evidence**
   - ADRs record durable technical choices, alternatives, consequences, and migration impact. They live in `docs/adr/`.
   - Spikes test uncertain assumptions or integration risks and record hypothesis, environment/version, method, observations, side effects, conclusion, and evidence. They live in `docs/spikes/<topic>/`.
   - A spike can justify a decision; an ADR records the resulting durable technical direction. Neither replaces a baseline roadmap.

4. **Code & Tests — Implemented truth**
   - Source, migrations, fixtures, tests, and packaged runtime behavior are the authority for what currently exists.
   - Tests must verify the relevant Nexus invariant, baseline acceptance behavior, and ADR contract where applicable.
   - Code does not silently redefine product intent. A code-versus-Nexus mismatch is documented drift that must be resolved by changing code or approving a Nexus decision.

### Authority and conflict rules

- Nexus wins for product intent, scope, vocabulary, and invariants.
- Code and tests win for claims about what is currently implemented.
- A baseline that conflicts with Nexus is stale or requires an explicit Nexus change proposal.
- An ADR that differs from code is stale, superseded, or exposes implementation drift.
- A spike whose environment, dependency, or version changed must be rerun before its result is treated as current evidence.
- Never resolve a cross-level conflict silently. Record the drift and update every affected level.

### Decision lifecycle

1. Record a material unresolved product choice as an OpenDecision in `docs/nexus/decision-register.md` when it can affect multiple workstreams or product invariants.
2. Record feature-local uncertainty in the affected baseline pack.
3. Run a spike when the choice depends on uncertain external or runtime behavior.
4. Write an ADR when a durable technical choice needs preserved rationale and consequences.
5. When a decision closes, preserve its original identifier and history, move it to closed status, and propagate the selected direction across every affected Nexus and baseline document.
6. Remove active ambiguity after closing a decision; do not leave rejected options written as current recommendations.

### Required documentation workflow

Before planning or implementing a workstream:

1. Read `docs/nexus/README.md` and the directly relevant Nexus documents.
2. Locate or create the bounded baseline pack for the workstream.
3. Identify open decisions, rejected assumptions, scope boundaries, and required evidence.
4. Create an ADR or repeatable spike only when the choice or uncertainty warrants it.
5. Implement and verify against explicit acceptance behavior.
6. Synchronize the baseline with actual code state and propagate any newly closed decisions.

For a greenfield capability, establish or amend Nexus intent before creating implementation baselines. For ongoing or brownfield work, use baseline packs to track reality and drift without duplicating the entire Nexus.

### Status language

- Use **proposed** or **planned** for behavior that has not been implemented.
- Use **implemented** only when code exists.
- Use **verified** only when current evidence or tests demonstrate the claim.
- Use **supported** only when the documented support contract is met, including error handling and recovery where required.
- Treat stale documentation as a defect; do not present roadmap intent as runtime truth.

### Expected directory structure

```text
docs/
  nexus/
  baseline/
    <workstream>/
  adr/
  spikes/
    <topic>/
src/
tests/
fixtures/
```

Add future non-documentation agent rules as separate top-level sections in this file. Do not mix build, coding-style, testing, security, or tooling rules into this `Documentation` section.
