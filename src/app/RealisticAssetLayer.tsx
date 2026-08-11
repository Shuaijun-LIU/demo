import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import type { ScenarioId } from "./urlState";
import {
  getAssetDefinition,
  getSceneAssetInstances,
  type AssetId,
  type AssetInstance,
} from "../scenarios/assetRegistry";

const proxyColors: Readonly<Partial<Record<AssetId, string>>> = {
  battery: "#8b8f8b",
  box: "#8a8171",
  tray: "#5f696b",
  scanner: "#4f5d61",
  "electronic-scale": "#697173",
  "pill-bottle": "#b1aea2",
};

export function getRealisticAssetSummary(sceneId: ScenarioId): string {
  return Array.from(
    new Set(getSceneAssetInstances(sceneId).map((instance) => instance.assetId)),
  ).join(",");
}

function AssetModel({ instance }: { readonly instance: AssetInstance }) {
  const definition = getAssetDefinition(instance.assetId);
  const uri = new URL(definition.uri, document.baseURI).toString();
  const gltf = useGLTF(uri);
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = mesh.material as MeshStandardMaterial;
      const material = source.clone();
      const fallbackColor = proxyColors[instance.assetId];
      if (!material.map && fallbackColor) material.color.set(fallbackColor);
      material.roughness = Math.max(material.roughness ?? 0.5, 0.52);
      mesh.material = material;
    });
    return clone;
  }, [gltf.scene, instance.assetId]);

  return (
    <primitive
      object={object}
      name={`real-${instance.objectId}`}
      position={[...instance.position]}
      rotation={[...instance.rotation]}
      scale={[...instance.scale]}
      userData={{ canonicalObjectId: instance.objectId, assetId: instance.assetId }}
    />
  );
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
        <AssetModel instance={instance} key={instance.id} />
      ))}
    </group>
  );
}
