import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSceneFile } from "./sceneFiles";

const expectations = [
  ["demo01", 3, 0.675, "p1"],
  ["demo02", 4, 0.675, "connector_a"],
  ["demo03", 3, 0.675, "carton_ok"],
  ["demo04", 4, 0.58, "spare_brace"],
  ["demo05", 3, 0.675, "tote"],
  ["demo06", 3, 0.665, "fruit_payload_proxy"],
] as const;

function materialRgb(xml: string, name: string) {
  const match = xml.match(new RegExp(`<material name="${name}" rgba="([^"]+)"`));
  if (!match) throw new Error(`Missing material ${name}`);
  return match[1].split(/\s+/).slice(0, 3).map(Number);
}

describe("static showroom scene invariants", () => {
  for (const [sceneId, armCount, mountingZ, payloadProxy] of expectations) {
    it(`${sceneId} is fixed, neutral, and mounts every Panda at the work surface`, () => {
      const xml = readFileSync(resolve(process.cwd(), "public", getSceneFile(sceneId)), "utf8");
      expect(xml).not.toContain("<freejoint");
      expect(xml).not.toContain('body name="task_payload"');
      expect(xml).not.toContain("emission=");
      expect(xml).toContain(`name="${payloadProxy}"`);
      expect(xml).toMatch(/<geom[^>]*type="plane"[^>]*group="3"/);

      const floorName = xml.includes('material name="floor_mat"') ? "floor_mat" : "floor";
      const floor = materialRgb(xml, floorName);
      const steel = materialRgb(xml, "steel");
      expect(Math.min(...floor)).toBeGreaterThanOrEqual(0.78);
      expect(Math.min(...steel)).toBeGreaterThanOrEqual(0.58);

      const bases = Array.from(xml.matchAll(/<frame pos="[^"]+ ([0-9.]+)"[^>]*>\s*<attach model="panda"/g));
      expect(bases).toHaveLength(armCount);
      expect(bases.every((match) => Math.abs(Number(match[1]) - mountingZ) <= 0.001)).toBe(true);
    });
  }
});
