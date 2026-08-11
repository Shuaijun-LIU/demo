import type { VisualScenarioId } from "../scenarios/visualCatalog";

export type LineId = "line1" | "line2";
export type ScenarioId = VisualScenarioId;

export interface DemoLocation {
  readonly lineId: LineId;
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
  const params = new URLSearchParams(search);
  const requestedScene = params.get("scene");
  return {
    lineId: params.get("line") === "line1" ? "line1" : "line2",
    sceneId: isScenarioId(requestedScene) ? requestedScene : "demo01",
  };
}

export function writeDemoLocation(location: DemoLocation): string {
  const params = new URLSearchParams();
  params.set("line", location.lineId);
  params.set("scene", location.sceneId);
  return `?${params.toString()}`;
}
