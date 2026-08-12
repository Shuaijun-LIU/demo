import { describe, expect, it } from "vitest";
import { interpolateMotionSample } from "./ScenarioMotionController";
import { getMotionProgram } from "../scenarios/motionCatalog";

describe("ScenarioMotionController interpolation", () => {
  it("changes arm pose continuously between semantic keyframes", () => {
    const arm = getMotionProgram("line2", "demo01").arms[0];
    const atStart = interpolateMotionSample(arm.keyframes, 0);
    const atApproach = interpolateMotionSample(arm.keyframes, 3);
    const midway = interpolateMotionSample(arm.keyframes, 1.5);
    expect(atStart.joints).not.toEqual(atApproach.joints);
    expect(Math.max(...atStart.joints.map((joint, index) => Math.abs(joint - atApproach.joints[index])))).toBeGreaterThan(0.15);
    expect(midway.joints).not.toEqual(atStart.joints);
    expect(midway.joints).not.toEqual(atApproach.joints);
  });

  it("keeps the final pose after the last keyframe", () => {
    const arm = getMotionProgram("line1", "demo06").arms[2];
    expect(interpolateMotionSample(arm.keyframes, 99)).toEqual(arm.keyframes.at(-1));
  });
});
