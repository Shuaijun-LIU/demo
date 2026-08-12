import { OrbitControls } from "@react-three/drei";
import { MujocoCanvas, MujocoProvider } from "mujoco-react";
import { useEffect, useMemo, useState } from "react";
import { getSceneFile } from "../scenarios/sceneFiles";
import type { VisualScenarioId } from "../scenarios/visualCatalog";
import { MujocoCheckerFloor } from "./MujocoCheckerFloor";

interface SceneViewportProps {
  readonly sceneId: VisualScenarioId;
  readonly armCount: 3 | 4;
}

const ARM_HOME_CONTROLS = [0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255] as const;

export function createHomeControls(armCount: number) {
  return Array.from({ length: armCount }, () => ARM_HOME_CONTROLS).flat();
}

function webGlAvailable() {
  return typeof window !== "undefined" && typeof window.WebGLRenderingContext !== "undefined";
}

export function SceneViewport({ sceneId, armCount }: SceneViewportProps) {
  const [renderState, setRenderState] = useState<"loading" | "ready" | "error">("loading");
  const config = useMemo(
    () => ({
      src: new URL(".", document.baseURI).toString(),
      sceneFile: getSceneFile(sceneId),
      numArmJoints: 7,
      homeJoints: createHomeControls(armCount),
    }),
    [armCount, sceneId],
  );

  useEffect(() => {
    setRenderState("loading");
  }, [sceneId]);

  if (!webGlAvailable()) {
    return (
      <div
        className="scene-viewport scene-fallback"
        data-testid="scene-viewport"
        data-scene-id={sceneId}
        data-up-axis="z"
        data-render-state="fallback"
        data-floor-style="blue-checker-white-grid"
      >
        <div className="fallback-cell">
          <span>3D WORKCELL</span>
          <strong>{armCount} × Franka Panda</strong>
          <small>支持 WebGL 的浏览器将显示静态 MJCF 场景</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className="scene-viewport"
      data-testid="scene-viewport"
      data-scene-id={sceneId}
      data-up-axis="z"
      data-render-state={renderState}
      data-floor-style="blue-checker-white-grid"
    >
      <MujocoProvider>
        <MujocoCanvas
          key={sceneId}
          config={config}
          paused
          speed={0}
          onReady={() => setRenderState("ready")}
          onError={() => setRenderState("error")}
          shadows
          camera={{ position: [3.5, -4.5, 3.4], fov: 36, near: 0.01, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          onCreated={({ camera }) => {
            camera.up.set(0, 0, 1);
            camera.lookAt(0, 0, 0.72);
            camera.updateProjectionMatrix();
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#252a2e"]} />
          <fog attach="fog" args={["#252a2e", 6.5, 14]} />
          <ambientLight intensity={1.35} />
          <hemisphereLight args={["#ffffff", "#c8c9c6", 1.1]} />
          <directionalLight position={[3, -3, 6]} intensity={2.2} color="#ffffff" castShadow />
          <directionalLight position={[-4, 2, 4]} intensity={1.1} color="#f4f3ee" />
          <MujocoCheckerFloor />
          <OrbitControls
            makeDefault
            target={[0, 0, 0.72]}
            minDistance={2.4}
            maxDistance={7}
            minPolarAngle={0.35}
            maxPolarAngle={1.42}
            enableDamping
          />
        </MujocoCanvas>
      </MujocoProvider>
    </div>
  );
}
