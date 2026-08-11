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
type UnknownRecord = Record<string, unknown>;

const scenarioIds = new Set<string>(["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"]);
const armIds = new Set<string>(["arm1", "arm2", "arm3", "arm4"]);

function invalid(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, message: string): UnknownRecord {
  if (!isRecord(value)) invalid(message);
  return value;
}

function requireArray(value: unknown, message: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(message);
  return value;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function requireFiniteTuple(value: unknown, length: number, message: string): readonly number[] {
  const tuple = requireArray(value, message);
  if (tuple.length !== length || tuple.some((entry) => !finite(entry))) invalid(message);
  return tuple as readonly number[];
}

function requireStringArray(value: unknown, message: string): readonly string[] {
  const values = requireArray(value, message);
  if (values.some((entry) => !nonEmpty(entry))) invalid(message);
  return values as readonly string[];
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export function validateScenarioManifest(input: unknown): ScenarioManifest {
  const manifest = requireRecord(input, "Scenario manifest must be a manifest object");
  if (manifest.schemaVersion !== 1) invalid("Invalid schema version");
  if (![manifest.title, manifest.industry, manifest.investorPosition, manifest.defaultSeed].every(nonEmpty)) {
    invalid("Scenario title, industry, investor position, and seed must be nonblank");
  }
  if (!nonEmpty(manifest.id) || !scenarioIds.has(manifest.id)) invalid("Invalid scenario id " + String(manifest.id));
  if (manifest.armCount !== 3 && manifest.armCount !== 4) invalid("armCount must be 3 or 4");

  const arms = requireArray(manifest.arms, "Scenario arms must be an array of arm declarations");
  if (manifest.armCount !== arms.length) invalid("armCount " + manifest.armCount + " does not match " + arms.length + " arms");
  const declaredArms = new Set<string>();
  for (const value of arms) {
    const arm = requireRecord(value, "Each arm declaration must be an object");
    if (!nonEmpty(arm.id) || !armIds.has(arm.id) || declaredArms.has(arm.id)) invalid("Arms must have unique arm IDs");
    declaredArms.add(arm.id);
    requireFiniteTuple(arm.safeJoints, 7, "Each arm requires exactly 7 finite safe joints");
    if (!nonEmpty(arm.role) || !nonEmpty(arm.toolId)) invalid("Each arm requires a nonblank role and tool");
    const basePose = requireRecord(arm.basePose, "Each arm requires a finite base pose object");
    requireFiniteTuple(basePose.position, 3, "Arm base pose position must be exactly a finite Vec3 tuple");
    requireFiniteTuple(basePose.quaternion, 4, "Arm base pose quaternion must be exactly a finite quaternion tuple");
    requireFiniteTuple(arm.baseEuler, 3, "Arm base pose Euler angles must be exactly a finite Vec3 tuple");
  }

  const taskNodeIds = requireStringArray(manifest.taskNodeIds, "Task nodes must be a nonempty array of unique task node IDs");
  if (taskNodeIds.length === 0 || !unique(taskNodeIds)) invalid("Task nodes must be unique task node IDs");
  const nodes = new Set(taskNodeIds);

  const presentationCues = requireArray(manifest.presentationCues, "Presentation cues must be an array");
  const cueNodeIds = new Set<string>();
  const cameraIds = new Set<string>();
  for (const value of presentationCues) {
    const cue = requireRecord(value, "Each presentation cue must be an object");
    if (!nonEmpty(cue.nodeId) || !nodes.has(cue.nodeId)) invalid("Unknown cue node " + String(cue.nodeId));
    if (!nonEmpty(cue.narrationZh)) invalid("Empty narration for " + cue.nodeId);
    const focusArmIds = requireStringArray(cue.focusArmIds, "Cue focus arm IDs must be a nonempty array");
    if (focusArmIds.length === 0 || focusArmIds.some((id) => !declaredArms.has(id)) || !unique(focusArmIds)) invalid("Cue has unique declared focus arm IDs");
    if (cue.wristPipArmId !== undefined && (!nonEmpty(cue.wristPipArmId) || !declaredArms.has(cue.wristPipArmId))) invalid("Cue has unknown wrist PIP arm");
    const cameraCue = requireRecord(cue.cameraCue, "Each presentation cue requires a camera object");
    if (!nonEmpty(cameraCue.id) || cueNodeIds.has(cue.nodeId)) invalid("Cues must have unique cue node IDs");
    if (cameraIds.has(cameraCue.id)) invalid("Cues must have unique camera IDs");
    cueNodeIds.add(cue.nodeId);
    cameraIds.add(cameraCue.id);
    requireFiniteTuple(cameraCue.position, 3, "Cue camera position must be exactly a finite Vec3 tuple");
    requireFiniteTuple(cameraCue.target, 3, "Cue camera target must be exactly a finite Vec3 tuple");
    if (!finite(cameraCue.durationMs) || cameraCue.durationMs <= 0) invalid("Cue camera duration must be finite and positive");
  }

  const physicsSegments = requireArray(manifest.physicsSegments, "Physics segments must be an array");
  const physicsIds = new Set<string>();
  for (const value of physicsSegments) {
    const segment = requireRecord(value, "Each physics declaration must be an object");
    if (!nonEmpty(segment.id) || physicsIds.has(segment.id)) invalid("Physics segments must have unique IDs");
    physicsIds.add(segment.id);
    if (!nonEmpty(segment.nodeId) || !nodes.has(segment.nodeId)) invalid("Unknown physics node " + String(segment.nodeId));
    if ((segment.mode !== "mujoco" && segment.mode !== "kinematic") || !finite(segment.settleSteps) || !Number.isInteger(segment.settleSteps) || segment.settleSteps < 0) invalid("Invalid physics declaration");
  }

  const oracle = requireRecord(manifest.oracle, "Scenario oracle must be an oracle object");
  const initialState = requireRecord(oracle.initialState, "Oracle requires a nonempty initial state object");
  const expectedFinalState = requireRecord(oracle.expectedFinalState, "Oracle requires a nonempty expected final state object");
  if (Object.keys(initialState).length === 0) invalid("Oracle requires a nonempty initial state");
  if (Object.keys(expectedFinalState).length === 0) invalid("Oracle requires a nonempty expected final state");

  const inventory = requireArray(oracle.inventoryConservation, "Oracle requires valid inventory conservation rules");
  const inventoryItemIds = new Set<string>();
  if (inventory.length === 0) invalid("Oracle requires valid inventory conservation");
  for (const value of inventory) {
    const rule = requireRecord(value, "Each inventory rule must be an object");
    if (!nonEmpty(rule.itemId) || inventoryItemIds.has(rule.itemId)) invalid("Oracle requires unique inventory item IDs");
    inventoryItemIds.add(rule.itemId);
    if (!finite(rule.initialQuantity) || !finite(rule.expectedFinalQuantity) || rule.initialQuantity < 0 || rule.expectedFinalQuantity < 0) invalid("Oracle requires valid inventory conservation quantities");
  }

  const fault = requireRecord(oracle.scriptedFaultEvidence, "Oracle requires valid fault evidence object");
  if (!nonEmpty(fault.faultId) || !nonEmpty(fault.objectId) || !nonEmpty(fault.evidenceNodeId) || !nodes.has(fault.evidenceNodeId) || fault.expectedCount !== 1) invalid("Oracle requires valid fault evidence");

  const safePoseByArm = requireRecord(oracle.safePoseByArm, "Oracle requires safe poses by arm");
  for (const armId of declaredArms) {
    requireFiniteTuple(safePoseByArm[armId], 7, "Oracle requires 7 finite safe joints for " + armId);
  }

  if (!finite(oracle.maxDemoDurationSec) || oracle.maxDemoDurationSec <= 0) invalid("Oracle duration must be finite and positive");
  if (oracle.coordinationClass !== "strong-coupled" && oracle.coordinationClass !== "pipeline-sla") invalid("Invalid coordination class");
  const necessity = requireRecord(oracle.armNecessityOracle, "Coordination requires an arm necessity oracle object");
  if (oracle.coordinationClass !== necessity.kind) invalid("Coordination class must match arm necessity oracle");
  if (necessity.kind === "strong-coupled") {
    const requiredArmIds = requireStringArray(necessity.requiredArmIds, "Strong coordination requires declared arm IDs");
    const requiredPredicateIds = requireStringArray(necessity.requiredPredicateIds, "Strong coordination requires predicate IDs");
    if (requiredArmIds.length !== declaredArms.size || !unique(requiredArmIds) || requiredArmIds.some((id) => !declaredArms.has(id)) || requiredPredicateIds.length === 0) invalid("Strong coordination requires every declared arm exactly once");
  } else {
    const outcomes = requireArray(necessity.disabledArmOutcomes, "Pipeline coordination requires disabled-arm outcomes");
    const outcomeArmIds: string[] = [];
    let invalidOutcome = outcomes.length !== declaredArms.size;
    for (const value of outcomes) {
      const outcome = requireRecord(value, "Each disabled-arm outcome must be an object");
      if (!nonEmpty(outcome.armId) || !declaredArms.has(outcome.armId) || !finite(outcome.exceedsDurationSec) || outcome.exceedsDurationSec <= oracle.maxDemoDurationSec) {
        invalidOutcome = true;
      } else {
        outcomeArmIds.push(outcome.armId);
      }
    }
    if (invalidOutcome || !unique(outcomeArmIds)) invalid("Pipeline coordination requires every declared arm exactly once");
  }

  return input as ScenarioManifest;
}
