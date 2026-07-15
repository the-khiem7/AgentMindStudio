import type { Database } from "bun:sqlite";
import {
  INTERRUPTED_OPERATION_STATES,
  assertOperationTransition,
  type OperationState,
} from "../../../domain/operations/operation-state";

export function transitionOperation(
  database: Database,
  operationId: string,
  targetState: OperationState,
  updatedAt: string,
  failureCode?: string,
): void {
  const current = database.query("SELECT state FROM operations WHERE id = ?").get(operationId) as
    | { state: OperationState }
    | null;
  if (!current) throw new Error(`Operation not found: ${operationId}`);
  assertOperationTransition(current.state, targetState);

  const terminal = ["succeeded", "failed", "recovered", "partial_recovery"].includes(targetState);
  const recoveryIncrement = targetState === "recovering" ? 1 : 0;
  database.query(`
    UPDATE operations
    SET state = ?, updated_at = ?,
        finished_at = CASE WHEN ? THEN ? ELSE finished_at END,
        failure_code = COALESCE(?, failure_code),
        recovery_attempts = recovery_attempts + ?
    WHERE id = ?
  `).run(targetState, updatedAt, terminal ? 1 : 0, updatedAt, failureCode ?? null, recoveryIncrement, operationId);
}

export function markInterruptedOperationsForRecovery(database: Database, detectedAt: string): number {
  const placeholders = INTERRUPTED_OPERATION_STATES.map(() => "?").join(", ");
  const result = database.query(`
    UPDATE operations
    SET state = 'recovery_required', updated_at = ?, failure_code = 'PROCESS_INTERRUPTED'
    WHERE state IN (${placeholders})
  `).run(detectedAt, ...INTERRUPTED_OPERATION_STATES);
  return result.changes;
}

