export const ADAPTER_CONTRACT_VERSION = "1.0.0" as const;

export type AdapterContractVersion = typeof ADAPTER_CONTRACT_VERSION;
export type HarnessId = "copilot" | "codex" | "kiro" | "kilo";
export type SurfaceId = string;
export type ArtifactKind = "mcp-server" | "skill" | "instruction";
export type ConfigScope = "user-global";
export type ConfigLayerKind = "managed" | "user" | "runtime" | "plugin";
export type ConfigFormat = "json" | "jsonc" | "toml" | "yaml" | "markdown" | "directory";
export type Confidence = "verified" | "compatible" | "unverified" | "unknown";
export type SupportLevel = "supported" | "read-only" | "unsupported" | "blocked" | "unknown";
export type ReadOperation = "discover" | "parse" | "normalize" | "compare" | "raw-view";
export type MutationOperation =
  | "AddBinding"
  | "UpdateBinding"
  | "DisableBinding"
  | "RemoveBinding"
  | "UninstallContent"
  | "RemoveEverywhere"
  | "RestoreSnapshot";
export type TestCapability = "none" | "syntax" | "connection";
export type ReloadBehavior = "none" | "automatic" | "reload-window" | "restart-client" | "new-session" | "unknown";

export interface AdapterDescriptor {
  readonly contractVersion: AdapterContractVersion;
  readonly adapterId: string;
  readonly adapterVersion: string;
  readonly harnessId: HarnessId;
  readonly displayName: string;
  readonly surfaceIds: readonly SurfaceId[];
}

export interface VersionEvidence {
  readonly detectedVersion?: string;
  readonly detectionSource: "executable" | "extension" | "package" | "config-marker" | "unknown";
  readonly verifiedRange?: string;
  readonly confidence: Confidence;
}

export interface SchemaEvidence {
  readonly schemaId: string;
  readonly format: ConfigFormat;
  readonly confidence: Confidence;
  readonly evidenceRef: string;
}

export interface PreservationGuarantees {
  readonly unknownFields: "proven" | "not-proven" | "not-applicable";
  readonly comments: "proven" | "not-proven" | "not-applicable";
  readonly formatting: "exact" | "localized" | "normalized" | "not-proven" | "not-applicable";
  readonly secretReferences: "preserved" | "redacted-only" | "not-proven";
  readonly credentialBindings: "preserved-by-default" | "not-applicable" | "not-proven";
}

export interface CapabilityRow {
  readonly surfaceId: SurfaceId;
  readonly artifact: ArtifactKind;
  readonly scope: ConfigScope;
  readonly read: {
    readonly level: SupportLevel;
    readonly operations: readonly ReadOperation[];
  };
  readonly write: {
    readonly level: SupportLevel;
    readonly operations: readonly MutationOperation[];
  };
  readonly test: TestCapability;
  readonly reload: ReloadBehavior;
  readonly preservation: PreservationGuarantees;
  readonly clientVersion: VersionEvidence;
  readonly schema: SchemaEvidence;
  readonly limitations: readonly string[];
}

export interface CapabilityMatrixV1 {
  readonly contractVersion: AdapterContractVersion;
  readonly adapterId: string;
  readonly harnessId: HarnessId;
  readonly rows: readonly CapabilityRow[];
}

export interface DiscoverySnapshot {
  readonly platform: "windows" | "macos" | "linux";
  readonly homeDirectory: string;
  readonly environmentNames: readonly string[];
  readonly installedSurfaceVersions: Readonly<Record<SurfaceId, string | undefined>>;
}

export interface DiscoveredSource {
  readonly sourceId: string;
  readonly surfaceIds: readonly SurfaceId[];
  readonly scope: ConfigScope;
  readonly layer: ConfigLayerKind;
  readonly resolvedPath: string;
  readonly format: ConfigFormat;
  readonly precedence: number;
  readonly ownership: "user" | "managed" | "client" | "unknown";
  readonly writableByPolicy: boolean;
  readonly confidence: Confidence;
}

export interface SourceDocument {
  readonly source: DiscoveredSource;
  readonly fingerprint: string;
  readonly text: string;
}

export interface ParsedSource<TNative = unknown> {
  readonly source: DiscoveredSource;
  readonly fingerprint: string;
  readonly native: TNative;
  readonly diagnostics: readonly SafeDiagnostic[];
}

export interface SecretReference {
  readonly kind: "environment" | "header-name" | "credential-profile" | "unknown";
  readonly name: string;
}

export interface NormalizedArtifact {
  readonly kind: ArtifactKind;
  readonly nativeName: string;
  readonly identityEvidence: Readonly<Record<string, string | readonly string[]>>;
  readonly portableFields: Readonly<Record<string, unknown>>;
  readonly clientExtensions: Readonly<Record<string, unknown>>;
  readonly secretReferences: readonly SecretReference[];
  readonly enabled: boolean | "unknown";
}

export type CompatibilityState = "exact" | "convertible" | "partial" | "unsupported" | "blocked";

export interface CompatibilityResult {
  readonly state: CompatibilityState;
  readonly losses: readonly {
    readonly field: string;
    readonly reason: string;
  }[];
  readonly requiredChoices: readonly string[];
  readonly credentialBehavior: "preserve-target" | "explicit-replacement" | "not-applicable";
  readonly blockingCodes: readonly AdapterErrorCode[];
}

export interface PlanChoice {
  readonly choiceId: string;
  readonly selection: string;
}

export interface PlannedChange {
  readonly operation: MutationOperation;
  readonly sourceId: string;
  readonly targetSurfaceId: SurfaceId;
  readonly artifactKind: ArtifactKind;
  readonly semanticChanges: readonly string[];
  readonly expectedBeforeFingerprint: string;
  readonly preservesTargetCredentials: boolean;
}

export interface RenderedOutput {
  readonly sourceId: string;
  readonly expectedBeforeFingerprint: string;
  readonly text: string;
  readonly semanticDigest: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly SafeDiagnostic[];
}

export interface VerificationObservation {
  readonly sourceId: string;
  readonly fingerprint: string;
  readonly parsed: boolean;
  readonly semanticDigest: string;
}

export interface VerificationResult {
  readonly verified: boolean;
  readonly diagnostics: readonly SafeDiagnostic[];
}

export interface ReloadInstruction {
  readonly behavior: ReloadBehavior;
  readonly messageKey: string;
}

export interface SafeDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export type AdapterErrorCode =
  | "ADAPTER_CONTRACT_MISMATCH"
  | "VERSION_UNVERIFIED"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_UNREADABLE"
  | "SOURCE_MALFORMED"
  | "SCHEMA_UNSUPPORTED"
  | "ARTIFACT_UNSUPPORTED"
  | "WRITE_UNSUPPORTED"
  | "WRITE_BLOCKED"
  | "LOSSY_WRITE_BLOCKED"
  | "PRESERVATION_UNPROVEN"
  | "VALIDATION_FAILED"
  | "EXTERNAL_CHANGE"
  | "SECRET_REDACTION_FAILED"
  | "INTERNAL_ADAPTER_FAILURE";

export interface AdapterFailure {
  readonly code: AdapterErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly adapterId: string;
  readonly surfaceId?: SurfaceId;
  readonly sourceId?: string;
  readonly correlationId?: string;
  readonly safeDetails: Readonly<Record<string, string | number | boolean>>;
}

export interface ClientAdapterV1<TNative = unknown> {
  readonly descriptor: AdapterDescriptor;
  capabilities(): CapabilityMatrixV1;
  discover(snapshot: Readonly<DiscoverySnapshot>): readonly DiscoveredSource[];
  read(document: Readonly<SourceDocument>): ParsedSource<TNative>;
  normalize(parsed: Readonly<ParsedSource<TNative>>): readonly NormalizedArtifact[];
  compare(artifact: Readonly<NormalizedArtifact>, target: Readonly<CapabilityRow>): CompatibilityResult;
  planWrite(
    artifact: Readonly<NormalizedArtifact>,
    target: Readonly<CapabilityRow>,
    choices: readonly Readonly<PlanChoice>[],
    expectedBeforeFingerprint: string,
  ): readonly PlannedChange[];
  render(changes: readonly Readonly<PlannedChange>[], original: Readonly<SourceDocument>): RenderedOutput;
  validate(rendered: Readonly<RenderedOutput>, target: Readonly<CapabilityRow>): ValidationResult;
  postWriteCheck(
    expected: Readonly<RenderedOutput>,
    observed: Readonly<VerificationObservation>,
  ): VerificationResult;
  reloadGuidance(target: Readonly<CapabilityRow>): ReloadInstruction;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateCapabilityMatrix(matrix: Readonly<CapabilityMatrixV1>): readonly string[] {
  const errors: string[] = [];
  if (matrix.contractVersion !== ADAPTER_CONTRACT_VERSION) {
    errors.push(`unsupported contract version: ${matrix.contractVersion}`);
  }
  if (matrix.rows.length === 0) {
    errors.push("capability matrix has no rows");
  }

  const keys = new Set<string>();
  for (const row of matrix.rows) {
    const key = `${row.surfaceId}|${row.artifact}|${row.scope}|${row.schema.schemaId}`;
    if (keys.has(key)) {
      errors.push(`duplicate capability row: ${key}`);
    }
    keys.add(key);

    if (row.read.level === "supported" && row.read.operations.length === 0) {
      errors.push(`supported read row has no operations: ${key}`);
    }
    if (row.write.level === "supported") {
      if (row.artifact === "instruction") {
        errors.push(`instruction write is forbidden in MVP: ${key}`);
      }
      if (row.write.operations.length === 0) {
        errors.push(`supported write row has no operations: ${key}`);
      }
      if (row.clientVersion.confidence !== "verified" || !row.clientVersion.verifiedRange) {
        errors.push(`supported write row lacks verified client range: ${key}`);
      }
      if (row.schema.confidence !== "verified") {
        errors.push(`supported write row lacks verified schema: ${key}`);
      }
      if (row.preservation.unknownFields !== "proven") {
        errors.push(`supported write row lacks unknown-field preservation proof: ${key}`);
      }
      if (row.preservation.credentialBindings === "not-proven") {
        errors.push(`supported write row lacks credential preservation proof: ${key}`);
      }
    } else if (row.write.operations.length > 0) {
      errors.push(`non-writable row declares mutation operations: ${key}`);
    }
  }
  return errors;
}

export function assertCapabilityMatrix(matrix: Readonly<CapabilityMatrixV1>): void {
  const errors = validateCapabilityMatrix(matrix);
  assert(errors.length === 0, errors.join("; "));
}

const forbiddenErrorKeys = new Set([
  "raw",
  "rawSource",
  "sourceText",
  "token",
  "secret",
  "headers",
  "environment",
  "credentialValue",
]);

export function assertSafeAdapterFailure(failure: Readonly<AdapterFailure>): void {
  for (const key of Object.keys(failure.safeDetails)) {
    assert(!forbiddenErrorKeys.has(key), `unsafe adapter failure detail key: ${key}`);
  }
  assert(failure.message.length <= 240, "adapter failure message exceeds safe bound");
}
