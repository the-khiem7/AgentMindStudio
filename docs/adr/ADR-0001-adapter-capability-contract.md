# ADR-0001: Adapter and Capability Contract

- **Status:** Accepted
- **Date:** 2026-07-16
- **Decision owners:** AgentMindStudio maintainers
- **Gate:** TG-002
- **Contract version:** `1.0.0`

## Context

AgentMindStudio must add client adapters without adding harness-specific branches to the shared discovery, inventory, comparison, planning, or transaction services. The contract must preserve the Nexus distinction between harness, surface, config source, and layer even when several surfaces share one resolved source.

The contract also has to make unsafe support claims difficult. A successful parse is not evidence that a source can be written safely. Write support depends on the exact surface, artifact, user/global scope, schema evidence, preservation guarantees, and verified client range. Instruction sources remain read-only in the MVP.

TG-003 will verify the actual path, format, precedence, ownership, and reload behavior for every MVP surface. TG-004 will provide sanitized fixtures. This ADR defines the stable boundary those later artifacts must populate; it does not pre-approve their client-specific claims.

## Decision

Adopt the versioned `ClientAdapterV1` contract and capability schema in [`docs/spikes/adapter-contract/src/contract.ts`](../spikes/adapter-contract/src/contract.ts).

### 1. Core owns effects; adapters describe and transform

Adapters expose discovery, parse, normalization, comparison, planning, rendering, validation, post-write verification, and reload guidance. They do not receive a mutable filesystem or process port.

- `discover`, `read`, `normalize`, `compare`, and `planWrite` are pure with respect to external state.
- Discovery consumes an immutable environment snapshot and returns candidate sources. The application performs bounded existence/read checks.
- Read consumes bytes already acquired by the application and returns a parsed client-native document.
- Render returns candidate bytes; the transaction service owns fingerprint recheck, snapshot, atomic replacement, re-read, audit, and recovery.
- Post-write verification compares an application-supplied observation with the planned expectation; it does not read files itself.

TypeScript cannot prevent an implementation from reaching ambient globals, so purity is both an interface constraint and a review/test invariant. Adapters that perform direct filesystem or process effects violate the contract even if they compile.

### 2. Shared sources retain consuming surfaces

`DiscoveredSource` contains `surfaceIds[]`, `scope`, `layer`, normalized path, format, ownership, precedence, and confidence. Multiple surfaces may point at one source object. The application deduplicates by normalized resolved path without collapsing the surface identities.

### 3. Capabilities are rows, not adapter-wide booleans

Each `CapabilityRow` is keyed by:

```text
surface × artifact × scope × schema evidence × client version evidence
```

Every row declares:

- read level and supported read operations;
- write level and allowed domain operations;
- test/connection-test behavior;
- reload behavior;
- unknown-field, comment, formatting, secret-reference, and credential-binding preservation;
- client-version detection source, verified range, confidence, and schema identifier.

`supported`, `read-only`, `unsupported`, `blocked`, and `unknown` are explicit states. Missing rows mean unknown support, never implicit support.

A write row is valid only when it has a non-empty verified client range, `verified` schema confidence, at least one explicit mutation operation, and proven unknown-field plus credential-binding preservation. Instruction rows cannot declare write support in contract version `1.0.0`.

### 4. Compatibility separates fidelity from blockers

`CompatibilityResult` uses `exact`, `convertible`, `partial`, `unsupported`, or `blocked`. It separately reports field-level losses, required user choices, credential-preservation behavior, and blocking error codes. This prevents a lossy conversion from being represented as a generic warning or a policy/version failure from being mistaken for an unsupported format.

`partial` never authorizes a write by itself. Planning requires explicit user choices for every reported loss, and the application may still block the operation under the mutation safeguards.

### 5. Errors are structured and secret-safe

Adapters return or throw `AdapterFailure`, whose code comes from the stable taxonomy in the contract. Generic fields may contain only bounded, non-secret metadata. Raw source bytes, headers, environment values, tokens, and parsed secret values are forbidden in `message`, `safeDetails`, and generic logs. A correlation identifier may link to separately guarded diagnostics.

### 6. Contract evolution is explicit

- Backward-compatible additions increment the minor version and remain optional to older consumers.
- Changed meanings, removed fields, or new required methods require a major version and a new interface name.
- The registry rejects adapters whose `contractVersion` is not supported.
- Adding a surface or artifact that cannot be represented without breaking this model reopens TG-002.

## Proof and verification

The compileable spike under [`docs/spikes/adapter-contract/`](../spikes/adapter-contract/) contains Codex and Kilo proof adapters. Both are registered as `ClientAdapterV1` and are exercised by one condition-free core loop.

The proof verifies:

- strict TypeScript compilation;
- contract and capability schema validation;
- shared-source/multiple-surface representation;
- deterministic discovery, read, normalization, comparison, and planning calls;
- explicit write declarations and schema/version evidence;
- read-only instruction enforcement;
- safe structured error serialization;
- equivalent core orchestration for Codex TOML and Kilo JSONC proof documents.

Machine-readable evidence is linked from the TG-002 completion record. These proof documents are synthetic and secret-free; they are not substitutes for TG-003 source verification or TG-004 fixture coverage.

## Alternatives rejected

### One interface per client

Rejected because shared services would require client branches and new adapters would force core changes.

### Adapter-wide `canRead` / `canWrite` flags

Rejected because support varies by surface, artifact, scope, schema, version, and preservation behavior. A single boolean creates unsafe over-claims.

### Let adapters write files directly

Rejected because it bypasses the Nexus transaction sequence and makes snapshot, external-change detection, atomic replacement, audit, and rollback inconsistent.

### Treat unknown versions as unsupported

Rejected because Nexus decision ND-011 permits reads where parsing is safe. The capability row records version confidence independently and blocks only unsafe or lossy writes.

### Make `partial` conversion writable by default

Rejected because silent field loss contradicts reviewed manual mutation. Partial compatibility requires explicit field decisions and still remains subject to transaction gates.

## Consequences

### Positive

- Independent adapters can be added through data and interface implementations rather than core conditionals.
- Capability claims are inspectable by the UI and testable by fixtures.
- Mutation effects remain centralized in the transaction service.
- Unknown versions and read-only sources degrade explicitly instead of disappearing.
- TG-003, TG-004, TG-005, and TG-006 receive a stable vocabulary and data boundary.

### Costs and limitations

- Capability matrices are verbose and require evidence maintenance per surface/schema range.
- Parsers must preserve a client-native document alongside normalized assets.
- The application still needs runtime schema validation at plugin/adapter loading boundaries; compile-time TypeScript types alone are insufficient for untrusted or separately packaged adapters.
- Purity cannot be proven by types alone and requires review plus deterministic tests.

## Source evidence reviewed

- [Codex configuration reference](https://developers.openai.com/codex/config-reference): user configuration location and current MCP TOML keys.
- [Codex MCP guide](https://developers.openai.com/codex/mcp): stdio/HTTP configuration, enablement, timeouts, and tool filtering.
- [Kilo settings](https://kilo.ai/docs/getting-started/settings): shared JSONC settings across CLI, VS Code, and JetBrains and the current global path.
- [Kilo MCP guide](https://kilo.ai/docs/automate/mcp/using-in-kilo-code): local/remote MCP shapes, enablement, and global/project precedence.

These sources were reviewed on 2026-07-16. Their client-specific facts remain TG-003 evidence and do not become permanent contract invariants.
