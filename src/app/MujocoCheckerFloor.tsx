import { useEffect, useMemo } from "react";
import {
  DataTexture,
  NearestFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

const FLOOR_SIZE = 7;
const FLOOR_DIVISIONS = 28;

export function createMujocoCheckerTexture() {
  const darkBlue = [91, 130, 166, 255];
  const lightBlue = [136, 169, 198, 255];
  const texture = new DataTexture(
    new Uint8Array([
      ...darkBlue,
      ...lightBlue,
      ...lightBlue,
      ...darkBlue,
    ]),
    2,
    2,
    RGBAFormat,
    UnsignedByteType,
  );

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(FLOOR_DIVISIONS / 2, FLOOR_DIVISIONS / 2);
  texture.needsUpdate = true;
  return texture;
}

export function MujocoCheckerFloor() {
  const checkerTexture = useMemo(createMujocoCheckerTexture, []);

  useEffect(() => () => checkerTexture.dispose(), [checkerTexture]);

  return (
    <group name="mujoco-checker-floor">
      <mesh position={[0, 0, 0.001]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial map={checkerTexture} roughness={0.92} metalness={0} />
      </mesh>
      <gridHelper
        args={[FLOOR_SIZE, FLOOR_DIVISIONS, "#ffffff", "#ffffff"]}
        position={[0, 0, 0.003]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <lineBasicMaterial
          attach="material"
          color="#ffffff"
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </gridHelper>
    </group>
  );
}
