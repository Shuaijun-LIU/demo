import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSceneFile } from "./sceneFiles";

const expectations = [
  ["demo01", 3, 0.675], ["demo02", 4, 0.675],
  ["demo03", 3, 0.675], ["demo04", 4, 0.58],
  ["demo05", 3, 0.675], ["demo06", 3, 0.665],
] as const;

describe("retained scene mounting invariants", () => {
  for (const [sceneId, armCount, mountingZ] of expectations) {
    it(`${sceneId} mounts every Panda at the work surface`, () => {
      const xml = readFileSync(resolve(process.cwd(), "public", getSceneFile(sceneId)), "utf8");
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
