import type { ScenarioManifest } from "../runtime/scenarioManifest";

type ManifestInput = { readonly [key: string]: unknown };

export function makeManifest(overrides: ManifestInput = {}): ScenarioManifest {
  return {
    schemaVersion: 1, id: "demo01", title: "精密元器件检测与上料", industry: "电子制造",
    investorPosition: "首选落地", defaultSeed: "D01-20260812", armCount: 3,
    arms: [
      { id: "arm1", role: "feed", toolId: "parallel-gripper", basePose: { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }, baseEuler: [0, 0, 0], safeJoints: [0, -0.7, 0, -2.2, 0, 1.6, 0.78] },
      { id: "arm2", role: "inspect", toolId: "parallel-gripper", basePose: { position: [1, 0, 0], quaternion: [0, 0, 0, 1] }, baseEuler: [0, 0, 0], safeJoints: [0, -0.7, 0, -2.2, 0, 1.6, 0.78] },
      { id: "arm3", role: "route", toolId: "parallel-gripper", basePose: { position: [2, 0, 0], quaternion: [0, 0, 0, 1] }, baseEuler: [0, 0, 0], safeJoints: [0, -0.7, 0, -2.2, 0, 1.6, 0.78] },
    ],
    taskNodeIds: ["preflight", "handoff", "complete"],
    physicsSegments: [{ id: "grasp-p1", nodeId: "handoff", mode: "mujoco", settleSteps: 20 }],
    presentationCues: [{ nodeId: "handoff", narrationZh: "交接开始", cameraCue: { id: "overview", position: [2, -2, 2], target: [0, 0, 0.5], durationMs: 450 }, focusArmIds: ["arm1", "arm2"] }],
    oracle: {
      initialState: { P1: "feed" }, expectedFinalState: { P1: "A1" },
      inventoryConservation: [{ itemId: "P1", initialQuantity: 1, expectedFinalQuantity: 1 }],
      scriptedFaultEvidence: { faultId: "d01.p3-missing-back-mark", objectId: "P3", evidenceNodeId: "handoff", expectedCount: 1 },
      safePoseByArm: { arm1: [0, -0.7, 0, -2.2, 0, 1.6, 0.78], arm2: [0, -0.7, 0, -2.2, 0, 1.6, 0.78], arm3: [0, -0.7, 0, -2.2, 0, 1.6, 0.78] },
      coordinationClass: "pipeline-sla",
      armNecessityOracle: { kind: "pipeline-sla", disabledArmOutcomes: [{ armId: "arm1", exceedsDurationSec: 91 }, { armId: "arm2", exceedsDurationSec: 91 }, { armId: "arm3", exceedsDurationSec: 91 }] }, maxDemoDurationSec: 90,
    },
    ...overrides,
  } as ScenarioManifest;
}
