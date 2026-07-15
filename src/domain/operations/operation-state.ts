export const OPERATION_STATES = [
  "planned",
  "confirmed",
  "snapshotting",
  "applying",
  "verifying",
  "succeeded",
  "failed",
  "recovery_required",
  "recovering",
  "recovered",
  "partial_recovery",
] as const;

export type OperationState = (typeof OPERATION_STATES)[number];

const TRANSITIONS: Readonly<Record<OperationState, readonly OperationState[]>> = {
  planned: ["confirmed", "failed"],
  confirmed: ["snapshotting", "failed"],
  snapshotting: ["applying", "failed", "recovery_required"],
  applying: ["verifying", "failed", "recovery_required"],
  verifying: ["succeeded", "failed", "recovery_required"],
  succeeded: [],
  failed: [],
  recovery_required: ["recovering", "failed"],
  recovering: ["recovered", "partial_recovery", "failed", "recovery_required"],
  recovered: [],
  partial_recovery: [],
};

export const INTERRUPTED_OPERATION_STATES: readonly OperationState[] = [
  "snapshotting",
  "applying",
  "verifying",
  "recovering",
];

export function canTransitionOperation(from: OperationState, to: OperationState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertOperationTransition(from: OperationState, to: OperationState): void {
  if (!canTransitionOperation(from, to)) {
    throw new Error(`Invalid operation state transition: ${from} -> ${to}`);
  }
}

