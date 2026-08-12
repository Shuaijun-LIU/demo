import { findBodyByName, useBeforePhysicsStep } from "mujoco-react";
import { getGraspCalibration } from "../scenarios/graspCalibration";
import type { MujocoData, MujocoModel } from "mujoco-react";
import { getMotionProgram, type ArmKeyframe, type JointPose } from "../scenarios/motionCatalog";
import type { VisualScenarioId } from "../scenarios/visualCatalog";
import type { LineId } from "./urlState";

interface ScenarioMotionControllerProps {
  readonly active: boolean;
  readonly lineId: LineId;
  readonly sceneId: VisualScenarioId;
}

function smoothStep(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function interpolateMotionSample(keyframes: readonly ArmKeyframe[], timeSec: number): { joints: JointPose; gripper: number } {
  let nextIndex = keyframes.findIndex((frame) => frame.timeSec >= timeSec);
  if (nextIndex < 0) return keyframes[keyframes.length - 1];
  if (nextIndex === 0) return keyframes[0];
  const from = keyframes[nextIndex - 1];
  const to = keyframes[nextIndex];
  const alpha = smoothStep((timeSec - from.timeSec) / (to.timeSec - from.timeSec));
  return {
    joints: from.joints.map((joint, index) => joint + (to.joints[index] - joint) * alpha) as unknown as JointPose,
    gripper: from.gripper + (to.gripper - from.gripper) * alpha,
  };
}

function writeArm(model: MujocoModel, data: MujocoData, armIndex: number, joints: JointPose, gripper: number) {
  for (let jointIndex = 0; jointIndex < 8; jointIndex += 1) {
    const actuatorId = armIndex * 8 + jointIndex;
    const value = jointIndex < 7 ? joints[jointIndex] : gripper;
    data.ctrl[actuatorId] = value;
    if (jointIndex === 7) continue;
    const jointId = model.actuator_trnid[actuatorId * 2];
    const qposAddress = model.jnt_qposadr[jointId];
    data.qpos[qposAddress] = value;
    const dofAddress = model.jnt_dofadr[jointId];
    if (dofAddress >= 0) data.qvel[dofAddress] = 0;
  }
}

function carryPayload(model: MujocoModel, data: MujocoData, payloadBodyId: number, handBodyId: number, handToPayloadOffsetZ: number) {
  const jointId = model.body_jntadr[payloadBodyId];
  const qposAddress = model.jnt_qposadr[jointId];
  const dofAddress = model.jnt_dofadr[jointId];
  data.qpos[qposAddress] = data.xpos[handBodyId * 3];
  data.qpos[qposAddress + 1] = data.xpos[handBodyId * 3 + 1];
  data.qpos[qposAddress + 2] = data.xpos[handBodyId * 3 + 2] - handToPayloadOffsetZ;
  data.qpos[qposAddress + 3] = data.xquat[handBodyId * 4];
  data.qpos[qposAddress + 4] = data.xquat[handBodyId * 4 + 1];
  data.qpos[qposAddress + 5] = data.xquat[handBodyId * 4 + 2];
  data.qpos[qposAddress + 6] = data.xquat[handBodyId * 4 + 3];
  for (let index = 0; index < 6; index += 1) data.qvel[dofAddress + index] = 0;
}

export function ScenarioMotionController({ active, lineId, sceneId }: ScenarioMotionControllerProps) {
  const program = getMotionProgram(lineId, sceneId);
  const graspCalibration = getGraspCalibration(lineId, sceneId);

  useBeforePhysicsStep((model, data) => {
    if (!active) return;
    const timeSec = data.time % program.durationSec;
    program.arms.forEach((arm, armIndex) => {
      const sample = interpolateMotionSample(arm.keyframes, timeSec);
      writeArm(model, data, armIndex, sample.joints, sample.gripper);
    });

    if (timeSec < program.payload.graspTimeSec || timeSec >= program.payload.releaseTimeSec) return;
    const payloadBodyId = findBodyByName(model, program.payload.bodyName);
    const carrierArm = timeSec < program.payload.transferTimeSec
      ? program.payload.carrierArmIndices[0]
      : program.payload.carrierArmIndices[1];
    const handBodyId = findBodyByName(model, `arm${carrierArm + 1}_hand`);
    if (payloadBodyId >= 0 && handBodyId >= 0) carryPayload(model, data, payloadBodyId, handBodyId, graspCalibration.handToPayloadOffsetZ);
  });

  return null;
}
