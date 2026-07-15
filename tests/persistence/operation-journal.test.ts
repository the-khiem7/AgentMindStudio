import { describe, expect, test } from "bun:test";
import { canTransitionOperation } from "../../src/domain/operations/operation-state";
import {
  markInterruptedOperationsForRecovery,
  transitionOperation,
} from "../../src/infrastructure/persistence/sqlite/operation-journal";
import { closeMetadataDatabase } from "../../src/infrastructure/persistence/sqlite/metadata-database";
import { createTemporaryDatabase } from "../helpers/temporary-database";

function insertOperation(database: ReturnType<typeof createTemporaryDatabase>["database"], id: string, state: string) {
  database.query(`
    INSERT INTO operations(id, operation_kind, state, created_at, updated_at)
    VALUES (?, 'UpdateBinding', ?, '2026-07-16T00:00:00.000Z', '2026-07-16T00:00:00.000Z')
  `).run(id, state);
}

describe("operation journal", () => {
  test("enforces documented forward and recovery transitions", () => {
    expect(canTransitionOperation("planned", "confirmed")).toBeTrue();
    expect(canTransitionOperation("confirmed", "snapshotting")).toBeTrue();
    expect(canTransitionOperation("snapshotting", "applying")).toBeTrue();
    expect(canTransitionOperation("applying", "verifying")).toBeTrue();
    expect(canTransitionOperation("verifying", "succeeded")).toBeTrue();
    expect(canTransitionOperation("recovery_required", "recovering")).toBeTrue();
    expect(canTransitionOperation("recovering", "recovered")).toBeTrue();
    expect(canTransitionOperation("succeeded", "applying")).toBeFalse();
  });

  test("persists valid transitions and rejects invalid ones", () => {
    const temporary = createTemporaryDatabase();
    try {
      insertOperation(temporary.database, "operation", "planned");
      transitionOperation(temporary.database, "operation", "confirmed", "2026-07-16T00:01:00.000Z");
      transitionOperation(temporary.database, "operation", "snapshotting", "2026-07-16T00:02:00.000Z");
      expect(() => transitionOperation(
        temporary.database,
        "operation",
        "succeeded",
        "2026-07-16T00:03:00.000Z",
      )).toThrow("Invalid operation state transition");
      const row = temporary.database.query("SELECT state FROM operations WHERE id = 'operation'").get();
      expect(row).toEqual({ state: "snapshotting" });
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });

  test("marks only interrupted side-effect states for crash recovery", () => {
    const temporary = createTemporaryDatabase();
    try {
      insertOperation(temporary.database, "planned", "planned");
      insertOperation(temporary.database, "confirmed", "confirmed");
      insertOperation(temporary.database, "snapshotting", "snapshotting");
      insertOperation(temporary.database, "applying", "applying");
      insertOperation(temporary.database, "verifying", "verifying");
      insertOperation(temporary.database, "recovering", "recovering");

      expect(markInterruptedOperationsForRecovery(temporary.database, "2026-07-16T00:10:00.000Z")).toBe(4);
      const rows = temporary.database
        .query("SELECT id, state, failure_code FROM operations ORDER BY id")
        .all();
      expect(rows).toEqual([
        { id: "applying", state: "recovery_required", failure_code: "PROCESS_INTERRUPTED" },
        { id: "confirmed", state: "confirmed", failure_code: null },
        { id: "planned", state: "planned", failure_code: null },
        { id: "recovering", state: "recovery_required", failure_code: "PROCESS_INTERRUPTED" },
        { id: "snapshotting", state: "recovery_required", failure_code: "PROCESS_INTERRUPTED" },
        { id: "verifying", state: "recovery_required", failure_code: "PROCESS_INTERRUPTED" },
      ]);
    } finally {
      closeMetadataDatabase(temporary.database);
      temporary.cleanup();
    }
  });
});

