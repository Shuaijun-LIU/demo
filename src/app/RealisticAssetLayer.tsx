import { CalibratedAssetModel } from "./RealisticAssetLayer.fixed";
import { useGLTF } from "@react-three/drei";
import type { ScenarioId } from "./urlState";
import {
  getSceneAssetInstances,
} from "../scenarios/assetRegistry";

export function getRealisticAssetSummary(sceneId: ScenarioId): string {
  return Array.from(
    new Set(getSceneAssetInstances(sceneId).map((instance) => instance.assetId)),
  ).join(",");
}

interface RealisticAssetLayerProps {
  readonly sceneId: ScenarioId;
  readonly visible?: boolean;
}

export function RealisticAssetLayer({
  sceneId,
  visible = true,
}: RealisticAssetLayerProps) {
  return (
    <group name={`line2-assets-${sceneId}`} visible={visible}>
      {getSceneAssetInstances(sceneId).map((instance) => (
        <CalibratedAssetModel instance={instance} key={instance.id} />
      ))}
    </group>
  );
}
