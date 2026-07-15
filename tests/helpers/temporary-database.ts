import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { openMetadataDatabase } from "../../src/infrastructure/persistence/sqlite/metadata-database";

export function createTemporaryDatabase() {
  const root = join(tmpdir(), `AgentMindStudio tests ${randomUUID()} kiểm chứng`);
  mkdirSync(root, { recursive: false });
  const path = join(root, "metadata.sqlite");
  const database = openMetadataDatabase(path);

  return {
    database,
    path,
    cleanup() {
      const resolvedTemp = resolve(tmpdir());
      const resolvedRoot = resolve(root);
      const relation = relative(resolvedTemp, resolvedRoot);
      if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
        throw new Error("Refusing to remove an unverified temporary path");
      }
      rmSync(resolvedRoot, { recursive: true, force: true });
    },
  };
}

