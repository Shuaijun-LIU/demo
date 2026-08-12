import { describe, expect, it } from "vitest";
import { getGraspCalibration } from "./graspCalibration";
import { getMotionProgram } from "./motionCatalog";

const lines = ["line1", "line2"] as const;
const scenes = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;

describe("MuJoCo grasp calibration", () => {
  for (const lineId of lines) {
    for (const sceneId of scenes) {
      it(`${lineId}/${sceneId} approaches its payload with the calibrated carrier arm`, () => {
        const calibration = getGraspCalibration(lineId, sceneId);
        const program = getMotionProgram(lineId, sceneId);
        expect(calibration.pickArmIndex).toBeGreaterThanOrEqual(0);
        expect(calibration.pickArmIndex).toBeLessThan(program.armCount);
        expect(calibration.graspGapMeters).toBeLessThan(0.04);
        expect(program.payload.carrierArmIndices[0]).toBe(calibration.pickArmIndex);
        expect(program.arms[calibration.pickArmIndex].keyframes[1].joints).toEqual(calibration.pickPose);
      });
    }
  }
});
