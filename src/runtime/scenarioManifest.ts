import type { ArmId, Pose, PresentationCue, ScenarioId } from "./types";

export interface ArmConfig {
  readonly id: ArmId; readonly role: string; readonly toolId: string; readonly basePose: Pose;
  readonly baseEuler: readonly [number, number, number]; readonly safeJoints: readonly number[];
}
export interface InventoryRule { readonly itemId: string; readonly initialQuantity: number; readonly expectedFinalQuantity: number; }
export interface ScriptedFaultEvidence { readonly faultId: string; readonly objectId: string; readonly evidenceNodeId: string; readonly expectedCount: number; }
export interface StrongCoupledArmNecessityOracle {
  readonly kind: "strong-coupled"; readonly requiredArmIds: readonly ArmId[]; readonly requiredPredicateIds: readonly string[];
}
export interface PipelineSlaArmNecessityOracle {
  readonly kind: "pipeline-sla"; readonly disabledArmOutcomes: readonly { readonly armId: ArmId; readonly exceedsDurationSec: number }[];
}
export type ArmNecessityOracle = StrongCoupledArmNecessityOracle | PipelineSlaArmNecessityOracle;
export interface PhysicsSegmentDeclaration { readonly id: string; readonly nodeId: string; readonly mode: "mujoco" | "kinematic"; readonly settleSteps: number; }
export interface ScenarioOracle {
  readonly initialState: Readonly<Record<string, unknown>>; readonly expectedFinalState: Readonly<Record<string, unknown>>;
  readonly inventoryConservation: readonly InventoryRule[]; readonly scriptedFaultEvidence: ScriptedFaultEvidence;
  readonly safePoseByArm: Readonly<Partial<Record<ArmId, readonly number[]>>>;
  readonly coordinationClass: "strong-coupled" | "pipeline-sla"; readonly armNecessityOracle: ArmNecessityOracle;
  readonly maxDemoDurationSec: number;
}
export interface ScenarioManifest {
  readonly schemaVersion: 1; readonly id: ScenarioId; readonly title: string; readonly industry: string;
  readonly investorPosition: string; readonly defaultSeed: string; readonly armCount: 3 | 4; readonly arms: readonly ArmConfig[];
  readonly taskNodeIds: readonly string[]; readonly physicsSegments: readonly PhysicsSegmentDeclaration[];
  readonly presentationCues: readonly PresentationCue[]; readonly oracle: ScenarioOracle;
}
const scenarioIds = new Set<ScenarioId>(["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"]);
const armIds = new Set<ArmId>(["arm1", "arm2", "arm3", "arm4"]);
const nonEmpty = (value: string): boolean => value.trim().length > 0;
const finite = (value: number): boolean => Number.isFinite(value);
const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;
const nonEmptyRecord = (value: Readonly<Record<string, unknown>>): boolean => Object.keys(value).length > 0;
function invalid(message: string): never { throw new Error(message); }

export function validateScenarioManifest(manifest: ScenarioManifest): ScenarioManifest {
  if (manifest.schemaVersion !== 1) invalid("Invalid schema version");
  if (![manifest.title, manifest.industry, manifest.investorPosition, manifest.defaultSeed].every(nonEmpty)) invalid("Scenario title, industry, investor position, and seed must be nonblank");
  if (!scenarioIds.has(manifest.id)) invalid("Invalid scenario id " + String(manifest.id));
  if (manifest.armCount !== 3 && manifest.armCount !== 4) invalid("armCount must be 3 or 4");
  if (manifest.armCount !== manifest.arms.length) invalid("armCount " + manifest.armCount + " does not match " + manifest.arms.length + " arms");
  const declaredArms = new Set<ArmId>();
  for (const arm of manifest.arms) {
    if (!armIds.has(arm.id) || declaredArms.has(arm.id)) invalid("Arms must have unique arm IDs");
    declaredArms.add(arm.id);
    if (!arm.safeJoints || arm.safeJoints.length !== 7 || arm.safeJoints.some((joint) => !finite(joint))) invalid("Each arm requires 7 finite safe joints");
    if (!nonEmpty(arm.role) || !nonEmpty(arm.toolId)) invalid("Each arm requires a nonblank role and tool");
    if ([...arm.basePose.position, ...arm.basePose.quaternion, ...arm.baseEuler].some((value) => !finite(value))) invalid("Each arm requires a finite base pose");
  }
  if (manifest.taskNodeIds.length === 0 || manifest.taskNodeIds.some((id) => !nonEmpty(id)) || !unique(manifest.taskNodeIds)) invalid("Task nodes must be unique task node IDs");
  const nodes = new Set(manifest.taskNodeIds);
  const cueNodeIds = new Set<string>();
  const cameraIds = new Set<string>();
  for (const cue of manifest.presentationCues) {
    if (!nodes.has(cue.nodeId)) invalid("Unknown cue node " + cue.nodeId);
    if (!nonEmpty(cue.narrationZh)) invalid("Empty narration for " + cue.nodeId);
    if (cue.focusArmIds.length === 0 || cue.focusArmIds.some((id) => !declaredArms.has(id)) || !unique(cue.focusArmIds)) invalid("Cue has unique declared focus arm IDs");
    if (cue.wristPipArmId !== undefined && !declaredArms.has(cue.wristPipArmId)) invalid("Cue has unknown wrist PIP arm");
    if (!nonEmpty(cue.cameraCue.id) || cueNodeIds.has(cue.nodeId)) invalid("Cues must have unique cue node IDs");
    if (cameraIds.has(cue.cameraCue.id)) invalid("Cues must have unique camera IDs");
    cueNodeIds.add(cue.nodeId);
    cameraIds.add(cue.cameraCue.id);
    if (!finite(cue.cameraCue.durationMs) || cue.cameraCue.durationMs <= 0 || [...cue.cameraCue.position, ...cue.cameraCue.target].some((value) => !finite(value))) invalid("Cue camera must be finite and positive");
  }
  const physicsIds = new Set<string>();
  for (const segment of manifest.physicsSegments) {
    if (!nonEmpty(segment.id) || physicsIds.has(segment.id)) invalid("Physics segments must have unique IDs");
    physicsIds.add(segment.id);
    if (!nodes.has(segment.nodeId)) invalid("Unknown physics node " + segment.nodeId);
    if ((segment.mode !== "mujoco" && segment.mode !== "kinematic") || !Number.isInteger(segment.settleSteps) || segment.settleSteps < 0) invalid("Invalid physics declaration");
  }
  const oracle = manifest.oracle;
  if (!nonEmptyRecord(oracle.initialState)) invalid("Oracle requires a nonempty initial state");
  if (!nonEmptyRecord(oracle.expectedFinalState)) invalid("Oracle requires a nonempty expected final state");
  if (oracle.inventoryConservation.length === 0 || oracle.inventoryConservation.some((rule) => !nonEmpty(rule.itemId) || !finite(rule.initialQuantity) || !finite(rule.expectedFinalQuantity) || rule.initialQuantity < 0 || rule.expectedFinalQuantity < 0)) invalid("Oracle requires valid inventory conservation");
  const fault = oracle.scriptedFaultEvidence;
  if (!nonEmpty(fault.faultId) || !nonEmpty(fault.objectId) || !nodes.has(fault.evidenceNodeId) || fault.expectedCount !== 1) invalid("Oracle requires valid fault evidence");
  for (const arm of manifest.arms) {
    const safePose = oracle.safePoseByArm[arm.id];
    if (!safePose || safePose.length !== 7 || safePose.some((joint) => !finite(joint))) invalid("Oracle requires 7 finite safe joints for " + arm.id);
  }
  if (oracle.coordinationClass !== oracle.armNecessityOracle.kind) invalid("Coordination class must match arm necessity oracle");
  const necessity = oracle.armNecessityOracle;
  if (necessity.kind === "strong-coupled") {
    if (necessity.requiredArmIds.length !== declaredArms.size || !unique(necessity.requiredArmIds) || necessity.requiredPredicateIds.length === 0 || necessity.requiredArmIds.some((id) => !declaredArms.has(id)) || necessity.requiredPredicateIds.some((id) => !nonEmpty(id))) invalid("Strong coordination requires every declared arm exactly once");
  } else if (necessity.disabledArmOutcomes.length !== declaredArms.size || !unique(necessity.disabledArmOutcomes.map((outcome) => outcome.armId)) || necessity.disabledArmOutcomes.some((outcome) => !declaredArms.has(outcome.armId) || !finite(outcome.exceedsDurationSec) || outcome.exceedsDurationSec <= oracle.maxDemoDurationSec)) {
    invalid("Pipeline coordination requires every declared arm exactly once");
  }
  if (!finite(oracle.maxDemoDurationSec) || oracle.maxDemoDurationSec <= 0) invalid("Oracle duration must be finite and positive");
  return manifest;
}
