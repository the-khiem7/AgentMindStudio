import { Database } from "bun:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { runMigrations } from "./migrations";

export function openMetadataDatabase(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path, { create: true, strict: true });
  runMigrations(database);
  return database;
}

export function closeMetadataDatabase(database: Database): void {
  database.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  database.close();
}

