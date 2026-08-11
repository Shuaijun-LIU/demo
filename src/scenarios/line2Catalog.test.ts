import { describe, expect, it } from "vitest";
import { getScenario, getScenarios } from "./line2Catalog";

describe("Line2 scenario catalog", () => {
  it("contains six task-ready workcells", () => {
    const scenarios = getScenarios("line2");

    expect(scenarios).toHaveLength(6);
    for (const scenario of scenarios) {
      expect(scenario.taskStages.length).toBeGreaterThanOrEqual(5);
      expect(scenario.collaboration.length).toBeGreaterThan(10);
      expect(scenario.fault.length).toBeGreaterThan(10);
      expect(scenario.recovery.length).toBeGreaterThan(10);
      expect(scenario.oracle.length).toBeGreaterThan(10);
      expect(scenario.tools.length).toBeGreaterThan(0);
    }
  });

  it("restores the pharmacy scene to four arms", () => {
    const pharmacy = getScenario("line2", "demo05");

    expect(pharmacy.armCount).toBe(4);
    expect(pharmacy.arms).toHaveLength(4);
    expect(pharmacy.arms[3]?.role).toBe("包装交付");
    expect(pharmacy.recovery).toContain("B1");
  });

  it("keeps six Line1 scenes available", () => {
    expect(getScenarios("line1")).toHaveLength(6);
    expect(getScenario("line1", "demo05").armCount).toBe(3);
  });
});
