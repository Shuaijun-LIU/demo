import type { Anchor, ArmId, CustodyState } from "./types";

const ARM_IDS: readonly ArmId[] = ["arm1", "arm2", "arm3", "arm4"];

export class CustodyConflictError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CustodyConflictError";
  }
}

function requireArmId(armId: ArmId): void {
  if (!ARM_IDS.includes(armId)) {
    throw new CustodyConflictError("Invalid custody arm");
  }
}

function requireIdentifier(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new CustodyConflictError(label + " must be nonblank");
  }
}

function freezeState(state: CustodyState): CustodyState {
  if (state.kind === "multiAnchor") {
    const anchors = state.anchors.map((anchor) => Object.freeze({ ...anchor }));
    return Object.freeze({ ...state, anchors: Object.freeze(anchors) });
  }
  return Object.freeze({ ...state });
}

export function freeCustody(objectId: string): Extract<CustodyState, { readonly kind: "free" }> {
  requireIdentifier(objectId, "Object id");
  return freezeState({ kind: "free" }) as Extract<CustodyState, { readonly kind: "free" }>;
}

export function claimExclusive(state: CustodyState, armId: ArmId): CustodyState {
  requireArmId(armId);
  if (state.kind !== "free") {
    throw new CustodyConflictError("Object is already held");
  }
  return freezeState({ kind: "exclusive", armId });
}

export function beginHandoff(state: CustodyState, sender: ArmId, receiver: ArmId): CustodyState {
  requireArmId(sender);
  requireArmId(receiver);
  if (sender === receiver) {
    throw new CustodyConflictError("Handoff arms must be different");
  }
  if (state.kind !== "exclusive" || state.armId !== sender) {
    throw new CustodyConflictError("Handoff sender does not own the object");
  }
  return freezeState({ kind: "handoff", sender, receiver });
}

export function completeHandoff(state: CustodyState, receiverConfirmed: boolean): CustodyState {
  if (state.kind !== "handoff") {
    throw new CustodyConflictError("No handoff is awaiting receiver confirmation");
  }
  if (receiverConfirmed !== true) {
    throw new CustodyConflictError("Handoff receiver confirmation is required");
  }
  return freezeState({ kind: "exclusive", armId: state.receiver });
}

export function claimMultiAnchor(
  state: CustodyState,
  compositeId: string,
  anchors: readonly Anchor[],
): Extract<CustodyState, { readonly kind: "multiAnchor" }> {
  requireIdentifier(compositeId, "Composite id");
  if (state.kind !== "free") {
    throw new CustodyConflictError("Object is already held");
  }
  if (anchors.length < 2) {
    throw new CustodyConflictError("Multi-anchor custody requires at least two anchors");
  }
  const attachmentIds = new Set<string>();
  const armIds = new Set<ArmId>();
  for (const anchor of anchors) {
    requireArmId(anchor.armId);
    requireIdentifier(anchor.attachmentId, "Attachment id");
    if (attachmentIds.has(anchor.attachmentId)) {
      throw new CustodyConflictError("Duplicate anchor attachment");
    }
    if (armIds.has(anchor.armId)) {
      throw new CustodyConflictError("Duplicate anchor arm");
    }
    attachmentIds.add(anchor.attachmentId);
    armIds.add(anchor.armId);
  }
  return freezeState({ kind: "multiAnchor", compositeId, anchors }) as Extract<CustodyState, { readonly kind: "multiAnchor" }>;
}

export function transferToFixture(state: CustodyState, fixtureId: string): CustodyState {
  requireIdentifier(fixtureId, "Fixture id");
  if (state.kind !== "multiAnchor") {
    throw new CustodyConflictError("Fixture takeover requires multi-anchor custody");
  }
  return freezeState({ kind: "fixture", fixtureId });
}

export function releaseCustody(state: CustodyState, armId: ArmId): CustodyState {
  requireArmId(armId);
  if (state.kind === "free") {
    return freezeState({ kind: "free" });
  }
  if (state.kind !== "exclusive" || state.armId !== armId) {
    throw new CustodyConflictError("Arm does not own exclusive custody");
  }
  return freezeState({ kind: "free" });
}
