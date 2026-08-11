import type { ArmId, CustodyState } from "./types";
import { CustodyConflictError, beginHandoff, completeHandoff } from "./objectCustody";

export interface HandoffEvent {
  readonly type: "HANDOFF_STARTED" | "HANDOFF_COMPLETED";
  readonly objectId: string;
  readonly armId: ArmId;
  readonly details: Readonly<Record<string, ArmId>>;
}

export interface HandoffTransition {
  readonly custody: CustodyState;
  readonly event: HandoffEvent;
}

function requireObjectId(objectId: string): void {
  if (objectId.trim().length === 0) {
    throw new CustodyConflictError("Object id must be nonblank");
  }
}

function copyEvent(event: HandoffEvent): HandoffEvent {
  return Object.freeze({
    ...event,
    details: Object.freeze({ ...event.details }),
  });
}

function transition(custody: CustodyState, event: HandoffEvent): HandoffTransition {
  return Object.freeze({ custody, event: copyEvent(event) });
}

export class HandoffCoordinator {
  public start(objectId: string, custody: CustodyState, sender: ArmId, receiver: ArmId): HandoffTransition {
    requireObjectId(objectId);
    const nextCustody = beginHandoff(custody, sender, receiver);
    return transition(nextCustody, {
      type: "HANDOFF_STARTED",
      objectId,
      armId: sender,
      details: { receiver },
    });
  }

  public complete(objectId: string, custody: CustodyState, receiver: ArmId, receiverConfirmed: boolean): HandoffTransition {
    requireObjectId(objectId);
    if (custody.kind !== "handoff" || custody.receiver !== receiver) {
      throw new CustodyConflictError("Handoff receiver does not match the custody state");
    }
    const nextCustody = completeHandoff(custody, receiverConfirmed);
    return transition(nextCustody, {
      type: "HANDOFF_COMPLETED",
      objectId,
      armId: receiver,
      details: { sender: custody.sender },
    });
  }
}
