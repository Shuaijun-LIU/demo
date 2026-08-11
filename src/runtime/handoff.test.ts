import { expect, it } from "vitest";
import { freeCustody } from "./objectCustody";
import { HandoffCoordinator } from "./handoff";

it("emits deterministic handoff events while custody remains the source of truth", () => {
  const coordinator = new HandoffCoordinator();
  const started = coordinator.start("P1", freeCustody("P1"), "arm1", "arm2");
  const completed = coordinator.complete("P1", started.custody, "arm2", true);

  expect(started.custody).toEqual({ kind: "handoff", sender: "arm1", receiver: "arm2" });
  expect(completed.custody).toEqual({ kind: "exclusive", armId: "arm2" });
  expect(coordinator.events()).toEqual([
    { type: "HANDOFF_STARTED", objectId: "P1", armId: "arm1", details: { receiver: "arm2" } },
    { type: "HANDOFF_COMPLETED", objectId: "P1", armId: "arm2", details: { sender: "arm1" } },
  ]);
});

it("rejects a mismatched receiving arm without emitting a completion event", () => {
  const coordinator = new HandoffCoordinator();
  const started = coordinator.start("P1", freeCustody("P1"), "arm1", "arm2");
  expect(() => coordinator.complete("P1", started.custody, "arm3", true)).toThrow(/receiver/i);
  expect(coordinator.events()).toHaveLength(1);
});
