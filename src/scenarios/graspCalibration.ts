import type { LineId, ScenarioId } from "../app/urlState";
import type { JointPose } from "./motionCatalog";

export interface GraspCalibration {
  readonly pickArmIndex: number;
  readonly pickPose: JointPose;
  readonly graspGapMeters: number;
  readonly handToPayloadOffsetZ: number;
}

const CALIBRATIONS: Readonly<Record<LineId, Readonly<Record<ScenarioId, GraspCalibration>>>> = {
  line1: {
    demo01: { pickArmIndex: 0, pickPose: [0.0351, 0.4688, 0.2235, -2.0853, 0.082, 2.2313, 0.78], graspGapMeters: 0.0059, handToPayloadOffsetZ: 0.11 },
    demo02: { pickArmIndex: 0, pickPose: [0.1811, 0.8966, 0.3121, -1.6376, 0.2402, 2.5441, 0.78], graspGapMeters: 0.0088, handToPayloadOffsetZ: 0.11 },
    demo03: { pickArmIndex: 1, pickPose: [0.6483, 1.5089, 0.2983, -0.4664, 0.1151, 2.663, 0.78], graspGapMeters: 0.0358, handToPayloadOffsetZ: 0.11 },
    demo04: { pickArmIndex: 1, pickPose: [0.0057, 0.592, -0.1324, -1.6116, -0.0348, 2.4663, 0.78], graspGapMeters: 0.0065, handToPayloadOffsetZ: 0.11 },
    demo05: { pickArmIndex: 1, pickPose: [0.0568, 0.6699, 0.2738, -1.8321, 0.1258, 2.4235, 0.78], graspGapMeters: 0.0028, handToPayloadOffsetZ: 0.11 },
    demo06: { pickArmIndex: 0, pickPose: [0.0481, 0.4928, 0.2589, -2.0771, 0.1061, 2.2422, 0.78], graspGapMeters: 0.0079, handToPayloadOffsetZ: 0.11 },
  },
  line2: {
    demo01: { pickArmIndex: 0, pickPose: [0.0426, 0.551, 0.2401, -1.9956, 0.0969, 2.3037, 0.78], graspGapMeters: 0.0028, handToPayloadOffsetZ: 0.11 },
    demo02: { pickArmIndex: 0, pickPose: [0.1933, 1.0153, 0.2904, -1.4419, 0.2208, 2.633, 0.78], graspGapMeters: 0.0088, handToPayloadOffsetZ: 0.11 },
    demo03: { pickArmIndex: 0, pickPose: [0.0897, 0.8788, 0.2834, -1.6605, 0.1599, 2.5439, 0.78], graspGapMeters: 0.007, handToPayloadOffsetZ: 0.11 },
    demo04: { pickArmIndex: 2, pickPose: [-0.0004, 0.7379, -0.1802, -1.6261, -0.0539, 2.5397, 0.78], graspGapMeters: 0.0071, handToPayloadOffsetZ: 0.11 },
    demo05: { pickArmIndex: 3, pickPose: [-0.2226, 1.2701, -0.2474, -1.016, -0.176, 2.748, 0.78], graspGapMeters: 0.0089, handToPayloadOffsetZ: 0.11 },
    demo06: { pickArmIndex: 0, pickPose: [0.0594, 0.6281, 0.2949, -1.8811, 0.1375, 2.3915, 0.78], graspGapMeters: 0.0082, handToPayloadOffsetZ: 0.11 },
  },
};

export function getGraspCalibration(lineId: LineId, sceneId: ScenarioId): GraspCalibration {
  return CALIBRATIONS[lineId][sceneId];
}
