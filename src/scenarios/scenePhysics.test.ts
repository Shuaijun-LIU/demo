import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSceneFile } from "./sceneFiles";

const expectations = [
  ["line1", "demo01", 3, 0.675], ["line1", "demo02", 4, 0.675],
  ["line1", "demo03", 3, 0.675], ["line1", "demo04", 4, 0.58],
  ["line1", "demo05", 3, 0.675], ["line1", "demo06", 3, 0.665],
  ["line2", "demo01", 3, 0.715], ["line2", "demo02", 4, 0.755],
  ["line2", "demo03", 3, 0.775], ["line2", "demo04", 4, 0.73],
  ["line2", "demo05", 4, 0.705], ["line2", "demo06", 3, 0.72],
] as const;

describe("Line1/Line2 physical scene invariants", () => {
  for (const [lineId, sceneId, armCount, mountingZ] of expectations) {
    it(`${lineId}/${sceneId} enables physics and mounts every Panda at the work surface`, () => {
      const xml = readFileSync(resolve(process.cwd(), "public", getSceneFile(lineId, sceneId)), "utf8");
      expect(xml).not.toContain('contact="disable"');
      expect(xml).toMatch(/gravity="0 0 -9\.81"/);
      const bases = Array.from(xml.matchAll(/<frame pos="[^"]+ ([0-9.]+)"[^>]*>\s*<attach model="panda"/g));
      expect(bases).toHaveLength(armCount);
      expect(bases.every((match) => Math.abs(Number(match[1]) - mountingZ) <= 0.001)).toBe(true);
      expect(xml).toContain('body name="task_payload"');
      expect(xml).toContain("<freejoint");
    });
  }
});
