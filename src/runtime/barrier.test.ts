import { expect, it } from "vitest";
import { BarrierCoordinator } from "./barrier";

it("opens only after every required arm arrives and duplicate arrivals are idempotent", () => {
  const barriers = new BarrierCoordinator();
  expect(barriers.arrive("join", "arm1", ["arm1", "arm2"])).toBe(false);
  expect(barriers.arrive("join", "arm1", ["arm1", "arm2"])).toBe(false);
  expect(barriers.arrive("join", "arm2", ["arm1", "arm2"])).toBe(true);
  expect(barriers.snapshot()).toEqual({ join: ["arm1", "arm2"] });
});

it("isolates barrier identities and validates their stable nonempty required set", () => {
  const barriers = new BarrierCoordinator();
  expect(barriers.arrive("first", "arm1", ["arm1", "arm2"])).toBe(false);
  expect(barriers.arrive("second", "arm1", ["arm1"])).toBe(true);
  expect(() => barriers.arrive("first", "arm2", ["arm1", "arm3"])).toThrow(/required set/i);
  expect(() => barriers.arrive("empty", "arm1", [])).toThrow(/nonempty/i);
  expect(() => barriers.arrive("bad", "arm3", ["arm1", "arm2"])).toThrow(/required/i);
});

it("restores independent snapshot data and resets individual barriers", () => {
  const barriers = new BarrierCoordinator();
  barriers.arrive("join", "arm1", ["arm1", "arm2"]);
  const saved = barriers.snapshot();
  barriers.reset("join");
  expect(barriers.snapshot()).toEqual({});
  barriers.restore(saved, { join: ["arm1", "arm2"] });
  saved.join.push("arm2");
  expect(barriers.snapshot()).toEqual({ join: ["arm1"] });
});

it("does not partially replace barriers when restore validation fails", () => {
  const barriers = new BarrierCoordinator();
  barriers.arrive("join", "arm1", ["arm1", "arm2"]);
  expect(() => barriers.restore({ next: ["arm3"] }, { next: ["arm1", "arm2"] })).toThrow(/outside/i);
  expect(barriers.snapshot()).toEqual({ join: ["arm1"] });
});
