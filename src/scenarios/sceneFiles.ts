import type { ScenarioId } from "../app/urlState";

export function getSceneFile(sceneId: ScenarioId): string {
  return `scenarios/${sceneId}/scene.xml`;
}
