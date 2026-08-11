import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSceneFile } from "./sceneFiles";

const sceneContracts = [
  ["demo01", 3, ["handoff_pad", "test_fixture", "tool_dock"]],
  ["demo02", 4, ["clip_c2", "tool_dock", "connector_s1"]],
  ["demo03", 3, ["carton_fixture", "scale", "ng_chute"]],
  ["demo04", 4, ["assembly_fixture", "tool_dock", "fastener_f2"]],
  ["demo05", 4, ["rx_merge", "packaging_gate", "return_bin"]],
  ["demo06", 3, ["pitter", "rework", "pit_bin"]],
] as const;

describe("Line2 MJCF workcells", () => {
  it("resolves independent Line1 and Line2 scene paths", () => {
    expect(getSceneFile("line1", "demo05")).toBe("scenarios/demo05/scene.xml");
    expect(getSceneFile("line2", "demo05")).toBe("scenarios/line2/demo05/scene.xml");
  });

  for (const [sceneId, armCount, requiredNames] of sceneContracts) {
    it(`${sceneId} has its required arms, task zones, and restrained materials`, () => {
      const xml = readFileSync(
        resolve(process.cwd(), "public", getSceneFile("line2", sceneId)),
        "utf8",
      );

      expect(xml.match(/<attach model="panda"/g) ?? []).toHaveLength(armCount);
      for (const requiredName of requiredNames) expect(xml).toContain(`name="${requiredName}"`);
      expect(xml).not.toMatch(/emission="(?:0\.[1-9]|[1-9])/);
      expect(xml).toContain("../../../models/franka/panda.xml");
    });
  }
});
