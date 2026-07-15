# TG-007 shadcn/ui ownership mapping

**Status:** Proposed implementation mapping; no production UI is implemented by this spike.

Google Stitch or local exploration output must not become maintained application source. Production screens should compose owned feature components from shadcn/ui primitives, with domain state and accessibility behavior tested in the application repository.

| Production area | Owned feature component | shadcn/ui primitives | Ownership notes |
|---|---|---|---|
| Desktop shell | `AppShell`, `PrimarySidebar`, `ContextHeader` | Sidebar, Breadcrumb, Separator, Tooltip, Button | Navigation labels and route model live in AMS source. |
| Scan health | `DiscoverySummary`, `SurfaceHealthCard`, `LayerStack` | Card, Badge, Progress, Collapsible, Table, Alert, Skeleton | Domain status mapper provides text/icon labels and confidence. |
| Unified inventory | `InventoryTable`, `InventoryFilters` | Data Table, Dropdown Menu, Popover, Command, Checkbox, Badge, Pagination | URL/query state and logical-asset grouping are owned behavior. |
| Coverage | `CoverageMatrix`, `CoverageCell`, `CoverageLegend` | Table, Badge, Tooltip, Scroll Area, Button | Use semantic table markup at MVP scale; cell action opens comparison. |
| Name collision | `NameCollisionPanel`, `BindingComparison` | Card, Tabs, Radio Group, Alert, Button, Separator | Capability rules enable actions; disabled reasons remain visible. |
| Alias linking | `AliasLinkPanel`, `AliasConfirmation` | Card, Alert Dialog, Radio Group, Badge, Button | Linking metadata is distinguished from Rename/write operations. |
| Raw/Semantic Diff | `ArtifactDiff`, `SemanticDiffSection`, `RawDiff` | Tabs, Toggle Group, Scroll Area, Collapsible, Badge, Tooltip | Raw renderer is owned and redaction-aware; no HTML from prototype is reused. |
| Plan review | `PlanSummary`, `CompatibilityWarning` | Card, Alert, Accordion, Checkbox, Button | No Apply action here; it opens the final drawer. |
| Final Apply | `ApplyReviewSheet`, `PathList`, `RecoverySummary` | Sheet, Scroll Area, Alert, Accordion, Checkbox, Separator, Button | Desktop Sheet is preferred over bottom Drawer; focus trap/restore is mandatory. |
| Skills failure | `OperationErrorPanel`, `SanitizedDiagnostics` | Alert, Card, Code/Scroll Area, Button, Collapsible | Error category is a stable domain code; raw stack/environment is excluded. |
| Instruction compare | `InstructionComparison`, `ReadOnlyBanner` | Alert, Badge, Tabs, Card, Scroll Area | Feature component API intentionally has no mutation callbacks. |
| Toast/status | `OperationStatus`, `ScanStatus` | Sonner, Progress, Alert | Toast is supplemental; durable outcome stays in page/activity history. |

## Component API constraints

- `CoverageCell` receives a domain state enum and accessible label; it does not infer state from color or CSS class.
- `ArtifactDiff` receives redacted semantic values and preclassified raw tokens. Rendering code never owns secret-classification policy.
- `ApplyReviewSheet` requires exact paths, target identities, preservation choices, snapshot policy, rollback summary, and warnings before enabling Apply.
- `InstructionComparison` has no `onApply`, `onEdit`, `onSync`, `onRemove`, or raw-write prop in MVP.
- Error components accept stable domain codes and sanitized details, not arbitrary stack traces or process environments.
- Feature components preserve surface identity (for example Copilot CLI versus Copilot VS Code) and layer identity in labels and test selectors.

## Suggested production tests

- Keyboard route and focus-return tests for sidebar, Coverage cells, comparison, and Apply Sheet.
- Contract tests proving Instruction comparison renders no mutation affordance.
- State-table snapshots verifying icon and text for all Coverage states.
- Redaction tests proving differing values remain hidden in semantic and raw views.
- Capability tests proving unavailable conflict actions are disabled with a reason.
- Apply Sheet tests proving exact paths, credential preservation, snapshot, rollback, and warnings are present before Apply enables.
