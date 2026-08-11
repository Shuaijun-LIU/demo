import type { LineId, ScenarioId } from "../app/urlState";

export function getSceneFile(lineId: LineId, sceneId: ScenarioId): string {
  return lineId === "line2"
    ? `scenarios/line2/${sceneId}/scene.xml`
    : `scenarios/${sceneId}/scene.xml`;
}
