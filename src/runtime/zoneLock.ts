import type { ArmId } from "./types";

const ARM_IDS: readonly ArmId[] = ["arm1", "arm2", "arm3", "arm4"];

export type ZoneLockSnapshot = Readonly<Record<string, ArmId>>;

function requireArmId(armId: ArmId): void {
  if (!ARM_IDS.includes(armId)) {
    throw new Error("Invalid arm id");
  }
}

function requireZoneId(zoneId: string): void {
  if (zoneId.trim().length === 0) {
    throw new Error("Zone id must be nonblank");
  }
}

export class ZoneLockManager {
  private readonly rankByZone = new Map<string, number>();
  private readonly owners = new Map<string, ArmId>();

  public constructor(globalOrder: readonly string[]) {
    if (globalOrder.length === 0) {
      throw new Error("Global zone order must be nonempty");
    }
    globalOrder.forEach((zoneId, index) => {
      requireZoneId(zoneId);
      if (this.rankByZone.has(zoneId)) {
        throw new Error("Global zone order has duplicate zone");
      }
      this.rankByZone.set(zoneId, index);
    });
  }

  public acquireMany(armId: ArmId, zoneIds: readonly string[]): boolean {
    requireArmId(armId);
    const ranks = zoneIds.map((zoneId) => this.requireRank(zoneId));
    for (let index = 1; index < ranks.length; index += 1) {
      if (ranks[index - 1] >= ranks[index]) {
        throw new Error("Zone request violates global order");
      }
    }

    const requested = new Set(zoneIds);
    if (requested.size !== zoneIds.length) {
      throw new Error("Zone request contains duplicate zone");
    }
    const newlyRequested = zoneIds.filter((zoneId) => this.owners.get(zoneId) !== armId);
    const highestHeldRank = this.highestHeldRank(armId);
    if (highestHeldRank !== undefined && newlyRequested.some((zoneId) => this.requireRank(zoneId) <= highestHeldRank)) {
      throw new Error("Zone request violates global order relative to held zones");
    }
    if (newlyRequested.some((zoneId) => this.owners.has(zoneId))) {
      return false;
    }
    for (const zoneId of newlyRequested) {
      this.owners.set(zoneId, armId);
    }
    return true;
  }

  public release(zoneId: string, armId: ArmId): boolean {
    requireArmId(armId);
    this.requireRank(zoneId);
    const owner = this.owners.get(zoneId);
    if (owner === undefined) {
      return true;
    }
    if (owner !== armId) {
      return false;
    }
    this.owners.delete(zoneId);
    return true;
  }

  public releaseAll(armId: ArmId): readonly string[] {
    requireArmId(armId);
    const released = [...this.owners.entries()]
      .filter(([, owner]) => owner === armId)
      .map(([zoneId]) => zoneId)
      .sort((left, right) => this.requireRank(left) - this.requireRank(right));
    released.forEach((zoneId) => this.owners.delete(zoneId));
    return Object.freeze(released);
  }

  public snapshot(): Record<string, ArmId> {
    return Object.fromEntries(this.owners.entries()) as Record<string, ArmId>;
  }

  public restore(snapshot: ZoneLockSnapshot): void {
    const nextOwners = new Map<string, ArmId>();
    for (const [zoneId, armId] of Object.entries(snapshot)) {
      this.requireRank(zoneId);
      requireArmId(armId);
      nextOwners.set(zoneId, armId);
    }
    this.owners.clear();
    nextOwners.forEach((armId, zoneId) => this.owners.set(zoneId, armId));
  }

  private requireRank(zoneId: string): number {
    requireZoneId(zoneId);
    const rank = this.rankByZone.get(zoneId);
    if (rank === undefined) {
      throw new Error("Unknown zone");
    }
    return rank;
  }

  private highestHeldRank(armId: ArmId): number | undefined {
    let highest: number | undefined;
    for (const [zoneId, owner] of this.owners.entries()) {
      if (owner === armId) {
        const rank = this.requireRank(zoneId);
        highest = highest === undefined ? rank : Math.max(highest, rank);
      }
    }
    return highest;
  }
}
