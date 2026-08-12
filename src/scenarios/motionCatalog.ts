import type { LineId, ScenarioId } from "../app/urlState";
import { getGraspCalibration } from "./graspCalibration";

export type JointPose = readonly [number, number, number, number, number, number, number];

export interface ArmKeyframe {
  readonly timeSec: number;
  readonly joints: JointPose;
  readonly gripper: number;
}

export interface ArmMotion {
  readonly armId: string;
  readonly keyframes: readonly ArmKeyframe[];
}

export interface PayloadMotion {
  readonly bodyName: "task_payload";
  readonly graspTimeSec: number;
  readonly transferTimeSec: number;
  readonly releaseTimeSec: number;
  readonly carrierArmIndices: readonly [number, number];
}

export interface MotionProgram {
  readonly durationSec: number;
  readonly armCount: 3 | 4;
  readonly arms: readonly ArmMotion[];
  readonly payload: PayloadMotion;
}

const HOME: JointPose = [0, -0.72, 0, -2.12, 0, 1.52, 0.78];
const sceneArmCounts: Readonly<Record<ScenarioId, 3 | 4>> = {
  demo01: 3,
  demo02: 4,
  demo03: 3,
  demo04: 4,
  demo05: 4,
  demo06: 3,
};

const sceneBias: Readonly<Record<ScenarioId, number>> = {
  demo01: 0.04,
  demo02: -0.06,
  demo03: 0.1,
  demo04: -0.12,
  demo05: 0.15,
  demo06: -0.02,
};

function pose(armIndex: number, phase: number, bias: number): JointPose {
  const handed = armIndex % 2 === 0 ? 1 : -1;
  const wave = phase === 1 ? 1 : phase === 2 ? -0.7 : 0.35;
  return [
    handed * (0.28 + bias) * wave,
    -0.72 - 0.2 * Math.abs(wave),
    -handed * 0.24 * wave,
    -2.12 + 0.28 * wave,
    handed * 0.18 * wave,
    1.52 + 0.22 * Math.abs(wave),
    0.78 - handed * 0.25 * wave,
  ];
}

function armMotion(lineId: LineId, sceneId: ScenarioId, armIndex: number): ArmMotion {
  const calibration = getGraspCalibration(lineId, sceneId);
  const lineBias = lineId === "line2" ? 0.06 : 0;
  const bias = sceneBias[sceneId] + lineBias;
  const offset = armIndex * 0.34;
  return {
    armId: `arm${armIndex + 1}`,
    keyframes: [
      { timeSec: 0, joints: HOME, gripper: 255 },
      { timeSec: 3 + offset, joints: armIndex === calibration.pickArmIndex ? calibration.pickPose : pose(armIndex, 1, bias), gripper: armIndex === calibration.pickArmIndex ? 40 : 180 },
      { timeSec: 6.4 + offset, joints: pose(armIndex, 2, bias), gripper: armIndex <= 1 ? 40 : 150 },
      { timeSec: 10.4 + offset, joints: pose(armIndex, 3, bias), gripper: 190 },
      { timeSec: 16, joints: HOME, gripper: 255 },
    ],
  };
}

export function getMotionProgram(lineId: LineId, sceneId: ScenarioId): MotionProgram {
  const armCount = sceneArmCounts[sceneId];
  return {
    durationSec: 16,
    armCount,
    arms: Array.from({ length: armCount }, (_, armIndex) => armMotion(lineId, sceneId, armIndex)),
    payload: {
      bodyName: "task_payload",
      graspTimeSec: 3.4,
      transferTimeSec: 7,
      releaseTimeSec: 11.2,
      carrierArmIndices: [getGraspCalibration(lineId, sceneId).pickArmIndex, getGraspCalibration(lineId, sceneId).pickArmIndex],
    },
  };
}
