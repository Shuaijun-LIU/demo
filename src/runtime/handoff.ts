import type { ArmId, CustodyState } from "./types";
import { CustodyConflictError, beginHandoff, claimExclusive, completeHandoff } from "./objectCustody";

export interface HandoffEvent {
  readonly type: "HANDOFF_STARTED" | "HANDOFF_COMPLETED";
  readonly objectId: string;
  readonly armId: ArmId;
  readonly details: Readonly<Record<string, ArmId>>;
}

export interface HandoffTransition {
  readonly custody: CustodyState;
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

export class HandoffCoordinator {
  private readonly history: HandoffEvent[] = [];

  public start(objectId: string, custody: CustodyState, sender: ArmId, receiver: ArmId): HandoffTransition {
    requireObjectId(objectId);
    const senderCustody = custody.kind === "free" ? claimExclusive(custody, sender) : custody;
    const nextCustody = beginHandoff(senderCustody, sender, receiver);
    this.history.push(copyEvent({
      type: "HANDOFF_STARTED",
      objectId,
      armId: sender,
      details: { receiver },
    }));
    return Object.freeze({ custody: nextCustody });
  }

  public complete(objectId: string, custody: CustodyState, receiver: ArmId, receiverConfirmed: boolean): HandoffTransition {
    requireObjectId(objectId);
    if (custody.kind !== "handoff" || custody.receiver !== receiver) {
      throw new CustodyConflictError("Handoff receiver does not match the custody state");
    }
    const nextCustody = completeHandoff(custody, receiverConfirmed);
    this.history.push(copyEvent({
      type: "HANDOFF_COMPLETED",
      objectId,
      armId: receiver,
      details: { sender: custody.sender },
    }));
    return Object.freeze({ custody: nextCustody });
  }

  public events(): readonly HandoffEvent[] {
    return Object.freeze(this.history.map(copyEvent));
  }
}
