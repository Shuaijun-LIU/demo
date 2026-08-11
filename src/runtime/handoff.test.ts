import { expect, it } from "vitest";
import { claimExclusive, freeCustody } from "./objectCustody";
import { HandoffCoordinator } from "./handoff";

it("returns one deeply immutable event with each custody transition", () => {
  const coordinator = new HandoffCoordinator();
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const started = coordinator.start("P1", held, "arm1", "arm2");
  const completed = coordinator.complete("P1", started.custody, "arm2", true);

  expect(started).toEqual({
    custody: { kind: "handoff", sender: "arm1", receiver: "arm2" },
    event: { type: "HANDOFF_STARTED", objectId: "P1", armId: "arm1", details: { receiver: "arm2" } },
  });
  expect(completed).toEqual({
    custody: { kind: "exclusive", armId: "arm2" },
    event: { type: "HANDOFF_COMPLETED", objectId: "P1", armId: "arm2", details: { sender: "arm1" } },
  });
  expect([
    Object.isFrozen(started),
    Object.isFrozen(started.event),
    Object.isFrozen(started.event.details),
    Object.isFrozen(completed),
    Object.isFrozen(completed.event),
    Object.isFrozen(completed.event.details),
  ]).toEqual([true, true, true, true, true, true]);
});

it("does not serialize a second event log across deterministic replay", () => {
  const coordinator = new HandoffCoordinator();
  const held = claimExclusive(freeCustody("P1"), "arm1");

  const first = coordinator.start("P1", held, "arm1", "arm2");
  const replay = coordinator.start("P1", held, "arm1", "arm2");

  expect(replay).toEqual(first);
  expect(replay).not.toBe(first);
  expect(JSON.stringify(coordinator)).toBe("{}");
});

it("requires the sender to hold exclusive custody before starting", () => {
  const coordinator = new HandoffCoordinator();
  expect(() => coordinator.start("P1", freeCustody("P1"), "arm1", "arm2")).toThrow(/sender.*own/i);
});

it("returns start and completion events in protocol order", () => {
  const coordinator = new HandoffCoordinator();
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const started = coordinator.start("P1", held, "arm1", "arm2");
  const completed = coordinator.complete("P1", started.custody, "arm2", true);
  expect([started.event, completed.event]).toEqual([
    { type: "HANDOFF_STARTED", objectId: "P1", armId: "arm1", details: { receiver: "arm2" } },
    { type: "HANDOFF_COMPLETED", objectId: "P1", armId: "arm2", details: { sender: "arm1" } },
  ]);
});

it("does not return a completion for non-boolean runtime confirmations", () => {
  const coordinator = new HandoffCoordinator();
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const started = coordinator.start("P1", held, "arm1", "arm2");
  const invalidConfirmations: readonly unknown[] = [1, "confirmed", null];

  for (const confirmation of invalidConfirmations) {
    let completion: unknown;
    expect(() => {
      completion = coordinator.complete("P1", started.custody, "arm2", confirmation as never);
    }).toThrow(/receiver confirmation/i);
    expect(completion).toBeUndefined();
  }
});

it("rejects a mismatched receiving arm without returning a completion transition", () => {
  const coordinator = new HandoffCoordinator();
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const started = coordinator.start("P1", held, "arm1", "arm2");
  expect(() => coordinator.complete("P1", started.custody, "arm3", true)).toThrow(/receiver/i);
});
