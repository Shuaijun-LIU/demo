import { expect, it } from "vitest";
import {
  CustodyConflictError,
  beginHandoff,
  claimExclusive,
  claimMultiAnchor,
  completeHandoff,
  freeCustody,
  releaseCustody,
  transferToFixture,
} from "./objectCustody";

it("converges a handoff to the receiving arm only after confirmation", () => {
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const shared = beginHandoff(held, "arm1", "arm2");

  expect(shared).toEqual({ kind: "handoff", sender: "arm1", receiver: "arm2" });
  expect(() => completeHandoff(shared, false)).toThrow(CustodyConflictError);
  expect(completeHandoff(shared, true)).toEqual({ kind: "exclusive", armId: "arm2" });
});

it("rejects invalid runtime arm actors before changing free custody", () => {
  expect(() => claimExclusive(freeCustody("P1"), "arm9" as never)).toThrow(/invalid custody arm/i);
});

it("rejects second claims, wrong senders, and handoffs to the same arm", () => {
  const held = claimExclusive(freeCustody("P1"), "arm1");
  expect(() => claimExclusive(held, "arm2")).toThrow(/already held/i);
  expect(() => beginHandoff(held, "arm2", "arm3")).toThrow(/sender/i);
  expect(() => beginHandoff(held, "arm1", "arm1")).toThrow(/different/i);
});

it("creates immutable unique multi-anchor custody and permits fixture takeover", () => {
  const anchors = [
    { armId: "arm1" as const, attachmentId: "left-grip" },
    { armId: "arm2" as const, attachmentId: "right-grip" },
  ];
  const anchored = claimMultiAnchor(freeCustody("harness"), "harness-main", anchors);

  expect(anchored).toEqual({ kind: "multiAnchor", compositeId: "harness-main", anchors });
  expect(anchored.anchors).not.toBe(anchors);
  expect(transferToFixture(anchored, "fixture-1")).toEqual({ kind: "fixture", fixtureId: "fixture-1" });
  expect(() => claimMultiAnchor(freeCustody("harness"), "harness-main", [anchors[0], anchors[0]])).toThrow(/duplicate anchor/i);
  expect(() => claimMultiAnchor(freeCustody("harness"), "harness-main", [
    anchors[0],
    { armId: "arm1", attachmentId: "other-point" },
  ])).toThrow(/duplicate.*arm/i);
});

it("releases only matching exclusive ownership and makes repeat safe release idempotent", () => {
  const held = claimExclusive(freeCustody("P1"), "arm3");
  expect(() => releaseCustody(held, "arm2")).toThrow(/does not own/i);
  const released = releaseCustody(held, "arm3");
  expect(released).toEqual({ kind: "free" });
  expect(releaseCustody(released, "arm3")).toBe(released);
});
