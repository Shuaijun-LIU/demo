import { describe, expect, it } from "vitest";
import { getMotionProgram } from "./motionCatalog";

const lines = ["line1", "line2"] as const;
const scenes = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;
const jointLimits = [2.8973, 1.7628, 2.8973, 3.0718, 2.8973, 3.7525, 2.8973];

describe("semantic multi-arm motion catalog", () => {
  for (const lineId of lines) {
    for (const sceneId of scenes) {
      it(`${lineId}/${sceneId} drives every arm and carries its payload only during active motion`, () => {
        const program = getMotionProgram(lineId, sceneId);
        expect(program.durationSec).toBeGreaterThanOrEqual(12);
        expect(program.arms).toHaveLength(program.armCount);
        for (const arm of program.arms) {
          expect(arm.keyframes.length).toBeGreaterThanOrEqual(4);
          expect(new Set(arm.keyframes.map((frame) => frame.joints.join(","))).size).toBeGreaterThan(2);
          for (const frame of arm.keyframes) {
            expect(frame.joints).toHaveLength(7);
            frame.joints.forEach((joint, index) => expect(Math.abs(joint)).toBeLessThanOrEqual(jointLimits[index]));
          }
        }
        expect(program.payload.bodyName).toBe("task_payload");
        expect(program.payload.releaseTimeSec).toBeGreaterThan(program.payload.graspTimeSec);
        expect(program.payload.releaseTimeSec).toBeLessThan(program.durationSec);
      });
    }
  }
});
