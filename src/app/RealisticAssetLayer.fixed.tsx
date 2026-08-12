import { useGLTF } from "@react-three/drei";
import { findBodyByName, useMujoco } from "mujoco-react";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Box3, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import type { AssetInstance } from "../scenarios/assetRegistry";
import { getAssetDefinition } from "../scenarios/assetRegistry";

const q = new Quaternion();

export function CalibratedAssetModel({ instance }: { readonly instance: AssetInstance }) {
  const definition = getAssetDefinition(instance.assetId);
  const uri = new URL(definition.uri, document.baseURI).toString();
  const gltf = useGLTF(uri);
  const rootRef = useRef<Group>(null);
  const mujoco = useMujoco();
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const material = (mesh.material as MeshStandardMaterial).clone();
      material.roughness = Math.max(material.roughness ?? 0.5, 0.52);
      mesh.material = material;
    });
    return clone;
  }, [gltf.scene]);

  useLayoutEffect(() => {
    object.rotation.set(-Math.PI / 2, 0, 0);
    object.scale.set(
      definition.sourceScale[0] * instance.scale[0],
      definition.sourceScale[1] * instance.scale[1],
      definition.sourceScale[2] * instance.scale[2],
    );
    object.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(object);
    const center = bounds.getCenter(new Vector3());
    object.position.set(-center.x, -center.y, -bounds.min.z);
  }, [definition.sourceScale, instance.scale, object]);

  useFrame(() => {
    if (!instance.bodyName || !rootRef.current || !mujoco.isReady) return;
    const model = mujoco.mjModelRef.current;
    const data = mujoco.mjDataRef.current;
    if (!model || !data) return;
    const bodyId = findBodyByName(model, instance.bodyName);
    if (bodyId < 0) return;
    rootRef.current.position.fromArray(data.xpos, bodyId * 3);
    q.set(data.xquat[bodyId * 4 + 1], data.xquat[bodyId * 4 + 2], data.xquat[bodyId * 4 + 3], data.xquat[bodyId * 4]);
    rootRef.current.quaternion.copy(q);
  });

  return (
    <group
      ref={rootRef}
      name={`real-${instance.objectId}`}
      position={[...instance.position]}
      rotation={[...instance.rotation]}
      userData={{ canonicalObjectId: instance.objectId, assetId: instance.assetId }}
    >
      <primitive object={object} />
    </group>
  );
}
