import { expect, it } from "vitest";
import type { ArmId } from "./types";
import { ZoneLockManager } from "./zoneLock";

it("grants globally ordered zones without a wait cycle", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  expect(locks.acquireMany("arm1", ["handoff", "inspect"])).toBe(true);
  expect(() => locks.acquireMany("arm2", ["inspect", "handoff"])).toThrow(/global order/i);
});

it("rejects an acquisition that descends below a zone already held by that arm", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  expect(locks.acquireMany("arm1", ["inspect"])).toBe(true);
  expect(() => locks.acquireMany("arm1", ["feed"])).toThrow(/global order/i);
  expect(locks.snapshot()).toEqual({ inspect: "arm1" });
});

it("keeps acquireMany atomic when any requested zone is unavailable", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  expect(locks.acquireMany("arm1", ["handoff"])).toBe(true);
  expect(locks.acquireMany("arm2", ["feed", "handoff"])).toBe(false);
  expect(locks.snapshot()).toEqual({ handoff: "arm1" });
});

it("is ownership-aware for idempotent release and releases all held zones", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  locks.acquireMany("arm1", ["feed", "handoff"]);
  expect(locks.release("feed", "arm2")).toBe(false);
  expect(locks.release("feed", "arm1")).toBe(true);
  expect(locks.release("feed", "arm1")).toBe(true);
  expect(locks.releaseAll("arm1")).toEqual(["handoff"]);
  expect(locks.snapshot()).toEqual({});
});

it("restores validated snapshots without retaining caller aliases", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  const snapshot: Record<string, ArmId> = { handoff: "arm2" };
  locks.restore(snapshot);
  snapshot.handoff = "arm3";
  expect(locks.snapshot()).toEqual({ handoff: "arm2" });
  const exported = locks.snapshot();
  exported.handoff = "arm4";
  expect(locks.snapshot()).toEqual({ handoff: "arm2" });
  expect(() => locks.restore({ unknown: "arm1" })).toThrow(/unknown zone/i);
  expect(() => locks.restore({ feed: "invalid" as never })).toThrow(/invalid arm/i);
});

it("keeps existing ownership when snapshot validation fails", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  locks.acquireMany("arm1", ["handoff"]);
  expect(() => locks.restore({ feed: "arm2", unknown: "arm3" })).toThrow(/unknown zone/i);
  expect(locks.snapshot()).toEqual({ handoff: "arm1" });
});
