import type { ArmId } from "./types";

const ARM_IDS: readonly ArmId[] = ["arm1", "arm2", "arm3", "arm4"];

export type BarrierSnapshot = Readonly<Record<string, readonly ArmId[]>>;

function requireArmId(armId: ArmId): void {
  if (!ARM_IDS.includes(armId)) {
    throw new Error("Invalid arm id");
  }
}

function requireBarrierId(barrierId: string): void {
  if (barrierId.trim().length === 0) {
    throw new Error("Barrier id must be nonblank");
  }
}

function normalizedRequired(required: readonly ArmId[]): readonly ArmId[] {
  if (required.length === 0) {
    throw new Error("Barrier required set must be nonempty");
  }
  const unique = new Set<ArmId>();
  for (const armId of required) {
    requireArmId(armId);
    if (unique.has(armId)) {
      throw new Error("Barrier required set has duplicate arm");
    }
    unique.add(armId);
  }
  return Object.freeze([...required]);
}

function sameSet(left: readonly ArmId[], right: readonly ArmId[]): boolean {
  return left.length === right.length && left.every((armId) => right.includes(armId));
}

export class BarrierCoordinator {
  private readonly requiredByBarrier = new Map<string, readonly ArmId[]>();
  private readonly arrivalsByBarrier = new Map<string, Set<ArmId>>();

  public arrive(barrierId: string, armId: ArmId, required: readonly ArmId[]): boolean {
    requireBarrierId(barrierId);
    requireArmId(armId);
    const normalized = normalizedRequired(required);
    const established = this.requiredByBarrier.get(barrierId);
    if (established !== undefined && !sameSet(established, normalized)) {
      throw new Error("Barrier required set must remain stable");
    }
    if (!normalized.includes(armId)) {
      throw new Error("Arriving arm is not in the barrier required set");
    }
    if (established === undefined) {
      this.requiredByBarrier.set(barrierId, normalized);
    }
    const arrivals = this.arrivalsByBarrier.get(barrierId) ?? new Set<ArmId>();
    arrivals.add(armId);
    this.arrivalsByBarrier.set(barrierId, arrivals);
    return normalized.every((requiredArm) => arrivals.has(requiredArm));
  }

  public reset(barrierId?: string): void {
    if (barrierId === undefined) {
      this.requiredByBarrier.clear();
      this.arrivalsByBarrier.clear();
      return;
    }
    requireBarrierId(barrierId);
    this.requiredByBarrier.delete(barrierId);
    this.arrivalsByBarrier.delete(barrierId);
  }

  public snapshot(): Record<string, ArmId[]> {
    return Object.fromEntries(
      [...this.arrivalsByBarrier.entries()].map(([barrierId, arrivals]) => [
        barrierId,
        [...arrivals].sort(),
      ]),
    ) as Record<string, ArmId[]>;
  }

  public restore(snapshot: BarrierSnapshot, requiredByBarrier: Readonly<Record<string, readonly ArmId[]>>): void {
    const nextRequired = new Map<string, readonly ArmId[]>();
    const nextArrivals = new Map<string, Set<ArmId>>();
    const snapshotIds = Object.keys(snapshot);
    const requiredIds = Object.keys(requiredByBarrier);
    if (snapshotIds.length !== requiredIds.length || snapshotIds.some((barrierId) => !(barrierId in requiredByBarrier))) {
      throw new Error("Barrier snapshot requires matching required sets");
    }
    for (const barrierId of snapshotIds) {
      requireBarrierId(barrierId);
      const required = normalizedRequired(requiredByBarrier[barrierId]);
      const arrivals = snapshot[barrierId];
      const uniqueArrivals = new Set<ArmId>();
      for (const armId of arrivals) {
        requireArmId(armId);
        if (!required.includes(armId)) {
          throw new Error("Barrier snapshot contains an arm outside its required set");
        }
        if (uniqueArrivals.has(armId)) {
          throw new Error("Barrier snapshot has duplicate arrivals");
        }
        uniqueArrivals.add(armId);
      }
      nextRequired.set(barrierId, required);
      nextArrivals.set(barrierId, uniqueArrivals);
    }
    this.requiredByBarrier.clear();
    this.arrivalsByBarrier.clear();
    nextRequired.forEach((required, barrierId) => this.requiredByBarrier.set(barrierId, required));
    nextArrivals.forEach((arrivals, barrierId) => this.arrivalsByBarrier.set(barrierId, arrivals));
  }
}
