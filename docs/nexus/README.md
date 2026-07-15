# AgentMindStudio Project Nexus

The Nexus is the durable product foundation for this greenfield project. It defines why the product exists, the language the team uses, the boundaries that must not drift, and the decisions that every implementation baseline inherits.

## Documentation authority

1. **Nexus:** product intent, domain invariants, scope, and closed decisions.
2. **Baseline packs:** the current planned or implemented state of a feature or workstream.
3. **ADRs and spikes:** evidence for a technical choice or unresolved risk.
4. **Code and tests:** the truth about what is currently implemented.

Nexus wins when product intent conflicts with a baseline. Code wins when a document claims something is already implemented. A conflict must be reconciled explicitly; a baseline must never silently redefine the Nexus.

## Contents

- [Product charter](product-charter.md)
- [Domain model](domain-model.md)
- [Client and surface matrix](client-surface-matrix.md)
- [Diff UI specification](diff-ui-spec.md)
- [Capability map](capability-map.md)
- [Architecture principles](architecture-principles.md)
- [Decision register](decision-register.md)

## Change rule

A Nexus change requires an explicit product decision with rationale and affected documents. Normal implementation progress belongs in a baseline pack, not here.
