import { CryptoHasher } from "bun";
import type { Database } from "bun:sqlite";
import metadataMigration from "./migrations/0001_metadata.sql" with { type: "text" };

type Migration = Readonly<{
  version: number;
  name: string;
  source: string;
}>;

const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: "metadata", source: metadataMigration },
];

function checksum(source: string): string {
  return new CryptoHasher("sha256").update(source).digest("hex");
}

export function runMigrations(database: Database): void {
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      checksum_sha256 TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const findMigration = database.query(
    "SELECT name, checksum_sha256 FROM schema_migrations WHERE version = ?",
  );
  const insertMigration = database.query(
    "INSERT INTO schema_migrations(version, name, checksum_sha256, applied_at) VALUES (?, ?, ?, ?)",
  );

  for (const migration of MIGRATIONS) {
    const expectedChecksum = checksum(migration.source);
    const existing = findMigration.get(migration.version) as
      | { name: string; checksum_sha256: string }
      | null;
    if (existing) {
      if (existing.name !== migration.name || existing.checksum_sha256 !== expectedChecksum) {
        throw new Error(`Migration ${migration.version} does not match recorded metadata`);
      }
      continue;
    }

    database.transaction(() => {
      database.exec(migration.source);
      insertMigration.run(migration.version, migration.name, expectedChecksum, new Date().toISOString());
    })();
  }
}
