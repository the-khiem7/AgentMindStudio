import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import {
  closeMetadataDatabase,
  openMetadataDatabase,
} from "../../src/infrastructure/persistence/sqlite/metadata-database";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { createTemporaryDatabase } from "../helpers/temporary-database";

const REPRESENTATIVE_METADATA = `
INSERT INTO harness_installations VALUES ('install-codex', 'codex', 'Codex', NULL, '1.0.0', 'command', 'available', '2026-07-16T00:00:00.000Z');
INSERT INTO surfaces VALUES ('surface-codex-cli', 'install-codex', 'cli', 'Codex CLI', 'codex-adapter', '1.0.0');
INSERT INTO config_sources VALUES ('source-codex', 'C:\\Users\\Example\\.codex\\config.toml', 'toml', 'client', 1, 'sha256:source', '2026-07-16T00:00:00.000Z');
INSERT INTO surface_sources VALUES ('surface-codex-cli', 'source-codex');
INSERT INTO config_layers VALUES ('layer-codex-user', 'source-codex', 'user', 'user', 100, 'user', 1);
INSERT INTO logical_assets VALUES ('asset-mcp', 'mcp', 'local-tools', 'endpoint:sha256:mcp', 'verified', 'native', 'codex', '2026-07-16T00:00:00.000Z');
INSERT INTO logical_assets VALUES ('asset-skill', 'skill', 'review-helper', 'content:sha256:skill', 'verified', 'repository', 'example/review-helper@abc123', '2026-07-16T00:00:00.000Z');
INSERT INTO asset_aliases VALUES ('alias-mcp', 'asset-mcp', 'surface-codex-cli', 'tools', 'native');
INSERT INTO installed_contents VALUES ('content-skill', 'asset-skill', 'C:\\Users\\Example\\.codex\\skills\\review-helper', 'sha256:skill-content', 128, '2026-07-16T00:00:00.000Z');
INSERT INTO bindings VALUES ('binding-mcp-a', 'asset-mcp', 'surface-codex-cli', 'layer-codex-user', NULL, 'tools-a', 'enabled', 'exact', 'environment', 1);
INSERT INTO bindings VALUES ('binding-mcp-b', 'asset-mcp', 'surface-codex-cli', 'layer-codex-user', NULL, 'tools-b', 'disabled', 'convertible', 'none', 0);
INSERT INTO bindings VALUES ('binding-skill', 'asset-skill', 'surface-codex-cli', 'layer-codex-user', 'content-skill', 'review-helper', 'enabled', 'exact', 'none', 0);
INSERT INTO content_references VALUES ('content-reference', 'content-skill', 'binding-skill', 1);
INSERT INTO content_fingerprints VALUES ('fingerprint-mcp', 'asset-mcp', 'binding-mcp-a', 'sha256', 'sha256:normalized-mcp', '2026-07-16T00:00:00.000Z');
INSERT INTO schema_evidence VALUES ('schema-codex', 'surface-codex-cli', 'codex-toml-v1', 'verified', '1.0.0', '1.x', 'docs/spikes/client-surface-config/codex.md', '2026-07-16T00:00:00.000Z');
INSERT INTO capability_evidence VALUES ('capability-codex-mcp', 'surface-codex-cli', 'schema-codex', 'mcp', 'user', 'supported', 'read-only', 0, 1, 'restart');
INSERT INTO observations VALUES ('observation-codex', 'source-codex', 'binding-mcp-a', 'schema-codex', 'codex-adapter', 'sha256:source', 'valid', 'metadata-only', 1, NULL, '2026-07-16T00:00:00.000Z');
INSERT INTO intentional_differences VALUES ('difference-mcp', 'asset-mcp', 'binding-mcp-a', 'binding-mcp-b', 'CredentialBindingDifference', 'PER_CLIENT_OVERRIDE', '2026-07-16T00:00:00.000Z');
INSERT INTO sync_plans VALUES ('plan-1', 'confirmed', 'sha256:observations', '2026-07-16T00:00:00.000Z', '2026-07-16T00:01:00.000Z');
INSERT INTO sync_plan_actions VALUES ('plan-action-1', 'plan-1', 0, 'UpdateBinding', 'asset-mcp', 'binding-mcp-b', 'enabled', 1);
INSERT INTO operations VALUES ('operation-1', 'plan-1', 'UpdateBinding', 'succeeded', '2026-07-16T00:00:00.000Z', '2026-07-16T00:02:00.000Z', '2026-07-16T00:01:00.000Z', '2026-07-16T00:02:00.000Z', NULL, 0);
INSERT INTO operation_affected_paths VALUES ('affected-path-1', 'operation-1', 0, 'C:\\Users\\Example\\.codex\\config.toml', 'sha256:before', 'sha256:after');
INSERT INTO snapshot_indexes VALUES ('snapshot-1', 'operation-1', 'affected-path-1', 'operation-1/0000', 'operation-1/0000.snapshot', 'sha256:before', 256, '2026-07-16T00:01:00.000Z');
INSERT INTO operation_results VALUES ('operation-result-1', 'operation-1', 'succeeded', 'VERIFIED', 1, '2026-07-16T00:02:00.000Z');
`;

describe("SQLite migration 0001", () => {
  test("migrates a clean database and is idempotent", () => {
    const temporary = createTemporaryDatabase();
    try {
      runMigrations(temporary.database);
      const migration = temporary.database.query("SELECT version, name FROM schema_migrations").get();
      expect(migration).toEqual({ version: 1, name: "metadata" });
      const tableCount = temporary.database
        .query("SELECT count(*) AS count FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .get() as { count: number };
      expect(Number(tableCount.count)).toBeGreaterThanOrEqual(20);
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });

  test("preserves representative metadata after close and reopen", () => {
    const temporary = createTemporaryDatabase();
    try {
      temporary.database.exec(REPRESENTATIVE_METADATA);
      closeMetadataDatabase(temporary.database);

      const reopened = openMetadataDatabase(temporary.path);
      const counts = reopened.query(`
        SELECT
          (SELECT count(*) FROM harness_installations) AS installations,
          (SELECT count(*) FROM surfaces) AS surfaces,
          (SELECT count(*) FROM logical_assets) AS assets,
          (SELECT count(*) FROM bindings) AS bindings,
          (SELECT count(*) FROM observations) AS observations,
          (SELECT count(*) FROM operations) AS operations,
          (SELECT count(*) FROM snapshot_indexes) AS snapshots
      `).get();
      expect(counts).toEqual({
        installations: 1,
        surfaces: 1,
        assets: 2,
        bindings: 3,
        observations: 1,
        operations: 1,
        snapshots: 1,
      });
      closeMetadataDatabase(reopened);
    } finally {
      temporary.cleanup();
    }
  });

  test("rolls back a failed transaction", () => {
    const temporary = createTemporaryDatabase();
    try {
      const transaction = temporary.database.transaction(() => {
        temporary.database.run(
          "INSERT INTO logical_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ["rolled-back", "skill", "temporary", null, "unknown", null, null, "2026-07-16T00:00:00.000Z"],
        );
        throw new Error("intentional rollback");
      });
      expect(transaction).toThrow("intentional rollback");
      const result = temporary.database.query("SELECT count(*) AS count FROM logical_assets").get() as { count: number };
      expect(Number(result.count)).toBe(0);
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });

  test("stores no raw credential or snapshot-content columns", () => {
    const temporary = createTemporaryDatabase();
    try {
      const definitions = temporary.database
        .query("SELECT sql FROM sqlite_schema WHERE type = 'table' AND sql IS NOT NULL")
        .all() as { sql: string }[];
      const schema = definitions.map(({ sql }) => sql).join("\n").toLowerCase();
      expect(schema).not.toContain("credential_value");
      expect(schema).not.toContain("secret_value");
      expect(schema).not.toContain("access_token");
      expect(schema).not.toContain("snapshot_bytes");
      expect(schema).not.toContain("content_blob");
      expect(schema).not.toContain(" blob");
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });

  test("blocks shared-content deletion while a retained binding exists", () => {
    const temporary = createTemporaryDatabase();
    try {
      temporary.database.exec(REPRESENTATIVE_METADATA);
      expect(() => temporary.database.run("DELETE FROM installed_contents WHERE id = 'content-skill'"))
        .toThrow("installed content still has retained bindings");
      const check = temporary.database
        .query("SELECT reference_count, retained_reference_count FROM shared_content_deletion_checks WHERE installed_content_id = 'content-skill'")
        .get();
      expect(check).toEqual({ reference_count: 1, retained_reference_count: 1 });
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });
});

