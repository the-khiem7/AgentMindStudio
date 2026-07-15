import {
  ADAPTER_CONTRACT_VERSION,
  type AdapterFailure,
  type CapabilityMatrixV1,
  type CapabilityRow,
  type ClientAdapterV1,
  type CompatibilityResult,
  type DiscoverySnapshot,
  type DiscoveredSource,
  type NormalizedArtifact,
  type ParsedSource,
  type PlanChoice,
  type PlannedChange,
  type ReloadInstruction,
  type RenderedOutput,
  type SourceDocument,
  type ValidationResult,
  type VerificationObservation,
  type VerificationResult,
} from "./contract";

type NativeMcpServer = Readonly<{
  transport: "stdio" | "http";
  command?: readonly string[];
  url?: string;
  enabled?: boolean;
  environmentNames?: readonly string[];
  extensionKeys?: readonly string[];
}>;

type ProofNativeDocument = Readonly<{
  mcpServers: Readonly<Record<string, NativeMcpServer>>;
}>;

const proofPreservation = {
  unknownFields: "proven",
  comments: "proven",
  formatting: "localized",
  secretReferences: "preserved",
  credentialBindings: "preserved-by-default",
} as const;

const readOnlyPreservation = {
  unknownFields: "not-applicable",
  comments: "not-applicable",
  formatting: "not-applicable",
  secretReferences: "redacted-only",
  credentialBindings: "not-applicable",
} as const;

function capabilityRows(
  surfaceIds: readonly string[],
  format: "toml" | "jsonc",
  schemaId: string,
  evidenceRef: string,
): readonly CapabilityRow[] {
  return surfaceIds.flatMap((surfaceId): readonly CapabilityRow[] => [
    {
      surfaceId,
      artifact: "mcp-server",
      scope: "user-global",
      read: { level: "supported", operations: ["discover", "parse", "normalize", "compare", "raw-view"] },
      write: { level: "supported", operations: ["AddBinding", "UpdateBinding", "DisableBinding", "RemoveBinding"] },
      test: "syntax",
      reload: "new-session",
      preservation: proofPreservation,
      clientVersion: {
        detectedVersion: "proof-version",
        detectionSource: "config-marker",
        verifiedRange: "proof-only",
        confidence: "verified",
      },
      schema: { schemaId, format, confidence: "verified", evidenceRef },
      limitations: ["Synthetic TG-002 proof only; TG-003/TG-004 must replace proof evidence before production support."],
    },
    {
      surfaceId,
      artifact: "skill",
      scope: "user-global",
      read: { level: "unknown", operations: [] },
      write: { level: "unknown", operations: [] },
      test: "none",
      reload: "unknown",
      preservation: readOnlyPreservation,
      clientVersion: { detectionSource: "unknown", confidence: "unknown" },
      schema: { schemaId: `${schemaId}:skill:unknown`, format: "directory", confidence: "unknown", evidenceRef },
      limitations: ["Capability intentionally unclaimed until TG-003 evidence exists."],
    },
    {
      surfaceId,
      artifact: "instruction",
      scope: "user-global",
      read: { level: "read-only", operations: ["discover", "parse", "normalize", "compare", "raw-view"] },
      write: { level: "read-only", operations: [] },
      test: "none",
      reload: "unknown",
      preservation: readOnlyPreservation,
      clientVersion: { detectionSource: "unknown", confidence: "unverified" },
      schema: { schemaId: `${schemaId}:instruction:read-only`, format: "markdown", confidence: "unverified", evidenceRef },
      limitations: ["MVP contract forbids instruction mutation."],
    },
  ]);
}

function parseProofDocument(document: Readonly<SourceDocument>): ProofNativeDocument {
  const parsed = JSON.parse(document.text) as unknown;
  if (typeof parsed !== "object" || parsed === null || !("mcpServers" in parsed)) {
    throw new Error("proof document is missing mcpServers");
  }
  return parsed as ProofNativeDocument;
}

function normalizeProofDocument(parsed: Readonly<ParsedSource<ProofNativeDocument>>): readonly NormalizedArtifact[] {
  return Object.entries(parsed.native.mcpServers).map(([nativeName, server]) => ({
    kind: "mcp-server",
    nativeName,
    identityEvidence:
      server.transport === "http"
        ? { transport: "http", url: server.url ?? "" }
        : { transport: "stdio", command: server.command ?? [] },
    portableFields: {
      transport: server.transport,
      ...(server.url === undefined ? {} : { url: server.url }),
      ...(server.command === undefined ? {} : { command: server.command }),
    },
    clientExtensions: { extensionKeys: server.extensionKeys ?? [] },
    secretReferences: (server.environmentNames ?? []).map((name) => ({ kind: "environment" as const, name })),
    enabled: server.enabled ?? true,
  }));
}

abstract class ProofAdapter implements ClientAdapterV1<ProofNativeDocument> {
  abstract readonly descriptor: ClientAdapterV1<ProofNativeDocument>["descriptor"];
  protected abstract readonly source: DiscoveredSource;
  protected abstract readonly schemaId: string;
  protected abstract readonly evidenceRef: string;

  capabilities(): CapabilityMatrixV1 {
    return {
      contractVersion: ADAPTER_CONTRACT_VERSION,
      adapterId: this.descriptor.adapterId,
      harnessId: this.descriptor.harnessId,
      rows: capabilityRows(this.descriptor.surfaceIds, this.source.format as "toml" | "jsonc", this.schemaId, this.evidenceRef),
    };
  }

  discover(_snapshot: Readonly<DiscoverySnapshot>): readonly DiscoveredSource[] {
    return [this.source];
  }

  read(document: Readonly<SourceDocument>): ParsedSource<ProofNativeDocument> {
    return { source: document.source, fingerprint: document.fingerprint, native: parseProofDocument(document), diagnostics: [] };
  }

  normalize(parsed: Readonly<ParsedSource<ProofNativeDocument>>): readonly NormalizedArtifact[] {
    return normalizeProofDocument(parsed);
  }

  compare(artifact: Readonly<NormalizedArtifact>, target: Readonly<CapabilityRow>): CompatibilityResult {
    if (target.artifact !== artifact.kind) {
      return {
        state: "unsupported",
        losses: [],
        requiredChoices: [],
        credentialBehavior: "not-applicable",
        blockingCodes: ["ARTIFACT_UNSUPPORTED"],
      };
    }
    if (target.write.level !== "supported") {
      return {
        state: "blocked",
        losses: [],
        requiredChoices: [],
        credentialBehavior: "preserve-target",
        blockingCodes: ["WRITE_BLOCKED"],
      };
    }
    return {
      state: "convertible",
      losses: [],
      requiredChoices: [],
      credentialBehavior: "preserve-target",
      blockingCodes: [],
    };
  }

  planWrite(
    artifact: Readonly<NormalizedArtifact>,
    target: Readonly<CapabilityRow>,
    _choices: readonly Readonly<PlanChoice>[],
    expectedBeforeFingerprint: string,
  ): readonly PlannedChange[] {
    const compatibility = this.compare(artifact, target);
    if (compatibility.state === "unsupported" || compatibility.state === "blocked") {
      return [];
    }
    return [{
      operation: "AddBinding",
      sourceId: `${this.descriptor.adapterId}:user-global`,
      targetSurfaceId: target.surfaceId,
      artifactKind: artifact.kind,
      semanticChanges: [`add:${artifact.nativeName}`],
      expectedBeforeFingerprint,
      preservesTargetCredentials: true,
    }];
  }

  render(changes: readonly Readonly<PlannedChange>[], original: Readonly<SourceDocument>): RenderedOutput {
    return {
      sourceId: original.source.sourceId,
      expectedBeforeFingerprint: original.fingerprint,
      text: original.text,
      semanticDigest: changes.map((change) => change.semanticChanges.join(",")).join("|"),
    };
  }

  validate(rendered: Readonly<RenderedOutput>, _target: Readonly<CapabilityRow>): ValidationResult {
    return { valid: rendered.text.length > 0, diagnostics: [] };
  }

  postWriteCheck(expected: Readonly<RenderedOutput>, observed: Readonly<VerificationObservation>): VerificationResult {
    return {
      verified: observed.parsed && observed.sourceId === expected.sourceId && observed.semanticDigest === expected.semanticDigest,
      diagnostics: [],
    };
  }

  reloadGuidance(target: Readonly<CapabilityRow>): ReloadInstruction {
    return { behavior: target.reload, messageKey: `reload.${target.reload}` };
  }
}

export class CodexProofAdapter extends ProofAdapter {
  readonly descriptor = {
    contractVersion: ADAPTER_CONTRACT_VERSION,
    adapterId: "proof.codex",
    adapterVersion: "1.0.0",
    harnessId: "codex",
    displayName: "Codex proof adapter",
    surfaceIds: ["codex-cli", "codex-desktop", "codex-ide"] as const,
  } as const;

  protected readonly schemaId = "proof:codex:mcp-toml:v1";
  protected readonly evidenceRef = "ADR-0001; TG-003 verification pending";
  protected readonly source: DiscoveredSource = {
    sourceId: "proof.codex:user-global",
    surfaceIds: this.descriptor.surfaceIds,
    scope: "user-global",
    layer: "user",
    resolvedPath: "%USERPROFILE%\\.codex\\config.toml",
    format: "toml",
    precedence: 100,
    ownership: "user",
    writableByPolicy: true,
    confidence: "compatible",
  };
}

export class KiloProofAdapter extends ProofAdapter {
  readonly descriptor = {
    contractVersion: ADAPTER_CONTRACT_VERSION,
    adapterId: "proof.kilo",
    adapterVersion: "1.0.0",
    harnessId: "kilo",
    displayName: "Kilo proof adapter",
    surfaceIds: ["kilo-cli", "kilo-vscode", "kilo-jetbrains"] as const,
  } as const;

  protected readonly schemaId = "proof:kilo:mcp-jsonc:v1";
  protected readonly evidenceRef = "ADR-0001; TG-003 verification pending";
  protected readonly source: DiscoveredSource = {
    sourceId: "proof.kilo:user-global",
    surfaceIds: this.descriptor.surfaceIds,
    scope: "user-global",
    layer: "user",
    resolvedPath: "%USERPROFILE%\\.config\\kilo\\kilo.jsonc",
    format: "jsonc",
    precedence: 100,
    ownership: "user",
    writableByPolicy: true,
    confidence: "compatible",
  };
}

export function proofFailure(adapterId: string): AdapterFailure {
  return {
    code: "SOURCE_MALFORMED",
    message: "The selected configuration could not be parsed.",
    retryable: false,
    adapterId,
    correlationId: "tg002-proof",
    safeDetails: { format: "synthetic", line: 1 },
  };
}
