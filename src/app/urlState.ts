import type { VisualScenarioId } from "../scenarios/visualCatalog";

export type ScenarioId = VisualScenarioId;

export interface DemoLocation {
  readonly sceneId: ScenarioId;
}

export const SCENE_IDS: readonly ScenarioId[] = [
  "demo01",
  "demo02",
  "demo03",
  "demo04",
  "demo05",
  "demo06",
];

function isScenarioId(value: string | null): value is ScenarioId {
  return value !== null && SCENE_IDS.some((candidate) => candidate === value);
}

export function readDemoLocation(search: string): DemoLocation {
  const requestedScene = new URLSearchParams(search).get("scene");
  return { sceneId: isScenarioId(requestedScene) ? requestedScene : "demo01" };
}

export function writeDemoLocation(sceneId: ScenarioId): string {
  const params = new URLSearchParams();
  params.set("scene", sceneId);
  return `?${params.toString()}`;
}
