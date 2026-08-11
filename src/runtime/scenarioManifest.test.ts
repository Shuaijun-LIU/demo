import { expect, it } from "vitest";
import { makeManifest } from "../test/fixtures";
import { validateScenarioManifest } from "./scenarioManifest";

it("accepts a complete manifest unchanged", () => {
  const manifest = makeManifest();
  expect(validateScenarioManifest(manifest)).toBe(manifest);
});

it("rejects malformed JS inputs with deliberate validation errors", () => {
  const valid = makeManifest();
  const cases = [
    [null, /manifest object/],
    [{}, /schema version/],
    [makeManifest({ arms: [null, valid.arms[1], valid.arms[2]] }), /arm declaration/],
    [makeManifest({ arms: [{ ...valid.arms[0], basePose: null }, valid.arms[1], valid.arms[2]] }), /base pose/],
    [makeManifest({ presentationCues: [{ ...valid.presentationCues[0], cameraCue: null }] }), /camera/],
    [makeManifest({ oracle: null }), /oracle/],
    [makeManifest({ oracle: { ...valid.oracle, scriptedFaultEvidence: null } }), /fault evidence/],
  ] as const;

  for (const [input, message] of cases) {
    expect(() => validateScenarioManifest(input)).toThrow(message);
  }
});

it("rejects vectors with the wrong exact length", () => {
  const valid = makeManifest();
  const cases = [
    makeManifest({ arms: [{ ...valid.arms[0], basePose: { ...valid.arms[0].basePose, position: [0, 0] } }, valid.arms[1], valid.arms[2]] }),
    makeManifest({ arms: [{ ...valid.arms[0], basePose: { ...valid.arms[0].basePose, quaternion: [0, 0, 1] } }, valid.arms[1], valid.arms[2]] }),
    makeManifest({ arms: [{ ...valid.arms[0], baseEuler: [0, 0] }, valid.arms[1], valid.arms[2]] }),
    makeManifest({ presentationCues: [{ ...valid.presentationCues[0], cameraCue: { ...valid.presentationCues[0].cameraCue, target: [0, 0] } }] }),
  ];

  for (const input of cases) {
    expect(() => validateScenarioManifest(input)).toThrow(/exactly|tuple|base pose|camera/i);
  }
});

it("rejects duplicate inventory item rules", () => {
  const valid = makeManifest();
  const inventoryConservation = [
    ...valid.oracle.inventoryConservation,
    { itemId: "P1", initialQuantity: 2, expectedFinalQuantity: 2 },
  ];
  expect(() => validateScenarioManifest(makeManifest({
    oracle: { ...valid.oracle, inventoryConservation },
  }))).toThrow(/unique inventory item/i);
});

it("rejects an arm count that disagrees with arm declarations", () => {
  expect(() => validateScenarioManifest(makeManifest({ armCount: 4 }))).toThrow(/armCount 4.*3 arms/);
});

it("rejects presentation cues that reference an unknown task node", () => {
  expect(() => validateScenarioManifest(makeManifest({ presentationCues: [{
    nodeId: "missing-node", narrationZh: "交接开始",
    cameraCue: { id: "overview", position: [2, -2, 2], target: [0, 0, 0.5], durationMs: 450 }, focusArmIds: ["arm1"],
  }] }))).toThrow(/missing-node/);
});

it("rejects malformed arm, node, cue, and physics declarations", () => {
  const valid = makeManifest();
  const cases = [
    [{ id: "demo99" }, /scenario id/],
    [{ arms: [...valid.arms.slice(0, 2), valid.arms[0]] }, /unique arm/],
    [{ arms: [{ id: "arm1", safeJoints: [0] }, { id: "arm2", safeJoints: [0] }, { id: "arm3", safeJoints: [0] }] }, /7 finite safe joints/],
    [{ taskNodeIds: ["preflight", "preflight"] }, /unique task node/],
    [{ presentationCues: [
      { nodeId: "handoff", narrationZh: "一", cameraCue: { id: "a", position: [0, 0, 0], target: [0, 0, 0], durationMs: 1 }, focusArmIds: ["arm1"] },
      { nodeId: "handoff", narrationZh: "二", cameraCue: { id: "b", position: [0, 0, 0], target: [0, 0, 0], durationMs: 1 }, focusArmIds: ["arm1"] },
    ] }, /unique cue/],
    [{ physicsSegments: [{ id: "bad", nodeId: "missing", mode: "mujoco", settleSteps: 1 }] }, /missing/],
  ] as const;
  for (const [overrides, message] of cases) expect(() => validateScenarioManifest(makeManifest(overrides))).toThrow(message);
});

it("rejects incomplete oracle declarations", () => {
  const oracle = makeManifest().oracle as unknown as Record<string, unknown>;
  const cases = [
    [{ oracle: { ...oracle, initialState: {}, expectedFinalState: {} } }, /initial state/],
    [{ oracle: { ...oracle, inventoryConservation: [] } }, /inventory/],
    [{ oracle: { ...oracle, scriptedFaultEvidence: { faultId: "", objectId: "", evidenceNodeId: "", expectedCount: 0 } } }, /fault evidence/],
    [{ oracle: { ...oracle, coordinationClass: "strong-coupled", armNecessityOracle: { kind: "pipeline-sla", disabledArmOutcomes: [{ armId: "arm1", exceedsDurationSec: 91 }] } } }, /Coordination/],
    [{ oracle: { ...oracle, maxDemoDurationSec: 0 } }, /duration/],
  ] as const;
  for (const [overrides, message] of cases) expect(() => validateScenarioManifest(makeManifest(overrides))).toThrow(message);
});

it("rejects incomplete presentation and arm-necessity declarations", () => {
  const valid = makeManifest();
  const firstArm = valid.arms[0];
  const cases = [
    [{ schemaVersion: 2 }, /schema version/],
    [{ title: " " }, /title/],
    [{ arms: [{ ...firstArm, role: "" }, valid.arms[1], valid.arms[2]] }, /role/],
    [{ arms: [{ ...firstArm, basePose: { ...firstArm.basePose, position: [Infinity, 0, 0] } }, valid.arms[1], valid.arms[2]] }, /base pose/],
    [{ presentationCues: [{ ...valid.presentationCues[0], wristPipArmId: "arm4" }] }, /wrist PIP/],
    [{ presentationCues: [{ ...valid.presentationCues[0], focusArmIds: ["arm1", "arm1"] }] }, /focus arm/],
    [{ taskNodeIds: [...valid.taskNodeIds, "other"], presentationCues: [valid.presentationCues[0], { ...valid.presentationCues[0], nodeId: "other" }] }, /camera ID/],
    [{ oracle: { ...valid.oracle, armNecessityOracle: { kind: "pipeline-sla", disabledArmOutcomes: [{ armId: "arm1", exceedsDurationSec: 91 }, { armId: "arm2", exceedsDurationSec: 91 }, { armId: "arm2", exceedsDurationSec: 91 }] } } }, /every declared arm/],
  ] as const;
  for (const [overrides, message] of cases) expect(() => validateScenarioManifest(makeManifest(overrides))).toThrow(message);
});
