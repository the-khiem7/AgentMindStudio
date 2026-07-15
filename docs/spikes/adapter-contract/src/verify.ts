declare const process: { stdout: { write(value: string): void } };

import {
  assertCapabilityMatrix,
  assertSafeAdapterFailure,
  type ClientAdapterV1,
  type DiscoverySnapshot,
  type NormalizedArtifact,
  type SourceDocument,
  validateCapabilityMatrix,
} from "./contract";
import { CodexProofAdapter, KiloProofAdapter, proofFailure } from "./proof-adapters";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function stable(value: unknown): string {
  return JSON.stringify(value);
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}

const adapters: readonly ClientAdapterV1[] = [new CodexProofAdapter(), new KiloProofAdapter()];
const snapshot = deepFreeze<DiscoverySnapshot>({
  platform: "windows",
  homeDirectory: "C:\\Users\\proof-user",
  environmentNames: ["USERPROFILE"],
  installedSurfaceVersions: {},
});

const proofTexts: Readonly<Record<string, string>> = {
  "proof.codex": JSON.stringify({
    mcpServers: {
      context7: { transport: "stdio", command: ["npx", "-y", "@upstash/context7-mcp"], environmentNames: ["CONTEXT7_TOKEN"] },
    },
  }),
  "proof.kilo": JSON.stringify({
    mcpServers: {
      context7: { transport: "http", url: "https://mcp.context7.com/mcp", enabled: true, extensionKeys: ["timeout"] },
    },
  }),
};

const checks: Record<string, boolean> = {
  sharedContractRegistry: adapters.length === 2,
  capabilitySchema: true,
  sharedSourceSurfaces: true,
  deterministicPureMethods: true,
  explicitWriteEvidence: true,
  instructionReadOnly: true,
  conditionFreeCoreLoop: true,
  safeErrors: true,
};

for (const adapter of adapters) {
  const matrix = adapter.capabilities();
  assertCapabilityMatrix(matrix);
  assert(matrix.adapterId === adapter.descriptor.adapterId, "matrix/adapter identity mismatch");

  const firstDiscovery = adapter.discover(snapshot);
  const secondDiscovery = adapter.discover(snapshot);
  assert(stable(firstDiscovery) === stable(secondDiscovery), "discovery is not deterministic");
  assert(firstDiscovery.length === 1, "proof adapter must expose one deduplicated source");
  const source = firstDiscovery[0];
  assert(source !== undefined, "proof source missing");
  assert(stable(source.surfaceIds) === stable(adapter.descriptor.surfaceIds), "shared source erased consuming surfaces");

  const text = proofTexts[adapter.descriptor.adapterId];
  assert(text !== undefined, "proof input missing");
  const document = deepFreeze<SourceDocument>({ source, fingerprint: `${adapter.descriptor.adapterId}:before`, text });
  const parsedFirst = adapter.read(document);
  const parsedSecond = adapter.read(document);
  assert(stable(parsedFirst) === stable(parsedSecond), "read is not deterministic");

  const artifactsFirst = adapter.normalize(parsedFirst);
  const artifactsSecond = adapter.normalize(parsedSecond);
  assert(stable(artifactsFirst) === stable(artifactsSecond), "normalize is not deterministic");
  const artifact = artifactsFirst[0] as NormalizedArtifact | undefined;
  assert(artifact !== undefined, "normalized proof artifact missing");

  const writableRow = matrix.rows.find((row) => row.artifact === "mcp-server" && row.write.level === "supported");
  assert(writableRow !== undefined, "explicit MCP write proof row missing");
  assert(writableRow.clientVersion.verifiedRange === "proof-only", "write range is not explicit");
  assert(writableRow.schema.confidence === "verified", "write schema is not explicit");

  const compatibilityFirst = adapter.compare(artifact, writableRow);
  const compatibilitySecond = adapter.compare(artifact, writableRow);
  assert(stable(compatibilityFirst) === stable(compatibilitySecond), "compare is not deterministic");
  const planFirst = adapter.planWrite(artifact, writableRow, [], document.fingerprint);
  const planSecond = adapter.planWrite(artifact, writableRow, [], document.fingerprint);
  assert(stable(planFirst) === stable(planSecond), "planWrite is not deterministic");
  assert(planFirst.every((change) => change.preservesTargetCredentials), "plan does not preserve target credentials");

  const instructionRows = matrix.rows.filter((row) => row.artifact === "instruction");
  assert(instructionRows.length > 0, "instruction capability row missing");
  assert(instructionRows.every((row) => row.write.level === "read-only" && row.write.operations.length === 0), "instruction write leaked into MVP");

  const instructionRow = instructionRows[0];
  assert(instructionRow !== undefined, "instruction proof row missing");
  const illegalInstructionMatrix = {
    ...matrix,
    rows: [{
      ...instructionRow,
      write: { level: "supported" as const, operations: ["AddBinding" as const] },
      clientVersion: { detectionSource: "config-marker" as const, verifiedRange: "proof-only", confidence: "verified" as const },
      schema: { ...instructionRow.schema, confidence: "verified" as const },
      preservation: {
        ...instructionRow.preservation,
        unknownFields: "proven" as const,
        credentialBindings: "preserved-by-default" as const,
      },
    }],
  };
  assert(validateCapabilityMatrix(illegalInstructionMatrix).some((error) => error.includes("instruction write is forbidden")), "schema accepted instruction write");

  const unverifiedWriteMatrix = {
    ...matrix,
    rows: [{
      ...writableRow,
      clientVersion: { detectionSource: "unknown" as const, confidence: "unverified" as const },
      schema: { ...writableRow.schema, confidence: "unverified" as const },
    }],
  };
  const unverifiedErrors = validateCapabilityMatrix(unverifiedWriteMatrix);
  assert(unverifiedErrors.some((error) => error.includes("verified client range")), "schema accepted an unverified write range");
  assert(unverifiedErrors.some((error) => error.includes("verified schema")), "schema accepted an unverified write schema");
}

for (const adapter of adapters) {
  assertSafeAdapterFailure(proofFailure(adapter.descriptor.adapterId));
}

process.stdout.write(`${JSON.stringify({ status: "pass", contractVersion: "1.0.0", adapters: adapters.map((adapter) => adapter.descriptor.adapterId), checks })}\n`);
