export type ScenarioId = "demo01" | "demo02" | "demo03" | "demo04" | "demo05" | "demo06";
export type ArmId = "arm1" | "arm2" | "arm3" | "arm4";
export type RuntimeStatus = "READY" | "RUNNING" | "PAUSED" | "BLOCKED_PAUSED" | "RECOVERING" | "RESETTING" | "SUCCEEDED" | "ERROR";
export type Vec3 = readonly [number, number, number];
export type Quaternion = readonly [number, number, number, number];

export interface Pose { readonly position: Vec3; readonly quaternion: Quaternion; }
export interface ArmState {
  readonly jointPositions: readonly number[];
  readonly jointVelocities: readonly number[];
  readonly gripperOpening: number;
  readonly toolId: string;
  readonly pose: Pose;
}
export interface ObjectState { readonly pose: Pose; readonly velocity: Vec3; readonly attachedTo?: ArmId; readonly properties: Readonly<Record<string, unknown>>; }
export interface Anchor { readonly armId: ArmId; readonly attachmentId: string; }
export type CustodyState =
  | { readonly kind: "free" }
  | { readonly kind: "exclusive"; readonly armId: ArmId }
  | { readonly kind: "handoff"; readonly sender: ArmId; readonly receiver: ArmId }
  | { readonly kind: "multiAnchor"; readonly compositeId: string; readonly anchors: readonly Anchor[] }
  | { readonly kind: "fixture"; readonly fixtureId: string };
export interface ToolState { readonly toolId: string; readonly enabled: boolean; readonly properties: Readonly<Record<string, unknown>>; }
export interface CameraCue { readonly id: string; readonly position: Vec3; readonly target: Vec3; readonly durationMs: number; }
export interface PresentationCue { readonly nodeId: string; readonly narrationZh: string; readonly cameraCue: CameraCue; readonly focusArmIds: readonly ArmId[]; readonly wristPipArmId?: ArmId; }

export interface ScenarioSnapshot {
  readonly scenarioId: ScenarioId; readonly seed: string; readonly prngState: number; readonly status: RuntimeStatus;
  readonly activeNodeId: string; readonly nodeElapsedSec: number; readonly simTimeSec: number; readonly speed: 1 | 2;
  readonly arms: Readonly<Partial<Record<ArmId, ArmState>>>; readonly objects: Readonly<Record<string, ObjectState>>;
  readonly custody: Readonly<Record<string, CustodyState>>; readonly locks: Readonly<Record<string, ArmId>>;
  readonly barriers: Readonly<Record<string, readonly ArmId[]>>; readonly tools: Readonly<Record<string, ToolState>>;
  readonly inventory: Readonly<Record<string, number>>; readonly metrics: Readonly<Record<string, number | boolean | string>>;
  readonly faultCounts: Readonly<Record<string, number>>;
}
export interface RuntimeEvent {
  readonly seq: number; readonly atSec: number; readonly type: string; readonly nodeId?: string; readonly armId?: ArmId;
  readonly objectId?: string; readonly details: Readonly<Record<string, unknown>>;
}
