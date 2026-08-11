import type { RuntimeEvent, ScenarioSnapshot } from "../runtime/types";
import type { ScenarioManifest } from "../runtime/scenarioManifest";

export interface TaskGraphDefinition { readonly initialNodeId: string; readonly nodes: readonly { readonly id: string }[]; }
export interface TrajectorySpec { readonly id: string; readonly durationSec: number; readonly jointKeyframes: readonly { readonly atSec: number; readonly joints: readonly number[] }[]; }
export interface ScenarioSceneDefinition { readonly assetIds: readonly string[]; readonly physicsSegmentIds: readonly string[]; }
export interface OracleResult { readonly passed: boolean; readonly violations: readonly string[]; }
export interface ScenarioDefinition<TState = ScenarioSnapshot> {
  readonly manifest: ScenarioManifest; readonly taskGraph: TaskGraphDefinition;
  readonly trajectories: Readonly<Record<string, TrajectorySpec>>; readonly scene: ScenarioSceneDefinition;
  createInitialSnapshot(seed?: string): TState;
  evaluateOracle(snapshot: TState, events: readonly RuntimeEvent[]): OracleResult;
}
