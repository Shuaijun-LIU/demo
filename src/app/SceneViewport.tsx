import { OrbitControls } from "@react-three/drei";
import { MujocoCanvas, MujocoProvider } from "mujoco-react";
import { Suspense, useMemo } from "react";
import type { VisualScenarioId } from "../scenarios/visualCatalog";
import { getSceneFile } from "../scenarios/sceneFiles";
import { getRealisticAssetSummary, RealisticAssetLayer } from "./RealisticAssetLayer";
import type { LineId } from "./urlState";
import { ScenarioMotionController } from "./ScenarioMotionController";
import { SceneReadySignal } from "./SceneReadySignal";

export type PreviewMode = "idle" | "playing" | "paused";

interface SceneViewportProps {
  lineId: LineId;
  sceneId: VisualScenarioId;
  armCount: 3 | 4;
  mode: PreviewMode;
  resetToken: number;
  onStatusChange: (status: string) => void;
}

const ARM_HOME = [0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255];

function createHomeJoints(armCount: number) {
  return Array.from({ length: armCount }, () => ARM_HOME).flat();
}

function webGlAvailable() {
  return typeof window !== "undefined" && typeof window.WebGLRenderingContext !== "undefined";
}

export function SceneViewport({
  lineId,
  sceneId,
  armCount,
  mode,
  resetToken,
  onStatusChange,
}: SceneViewportProps) {
  const assetSummary = lineId === "line2" ? getRealisticAssetSummary(sceneId) : "";
  const config = useMemo(
    () => ({
      src: new URL(".", document.baseURI).toString(),
      sceneFile: getSceneFile(lineId, sceneId),
      numArmJoints: 7,
      homeJoints: createHomeJoints(armCount),
    }),
    [armCount, lineId, sceneId],
  );

  if (!webGlAvailable()) {
    return (
      <div
        className="scene-viewport scene-fallback"
        data-testid="scene-viewport"
        data-scene-id={sceneId}
        data-line-id={lineId}
        data-scene-assets={assetSummary}
        data-up-axis="z"
      >
        <div className="fallback-cell">
          <span>3D WORKCELL</span>
          <strong>{armCount} × Franka Panda</strong>
          <small>WebGL 浏览器中加载真实 MJCF 场景</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className="scene-viewport"
      data-testid="scene-viewport"
      data-scene-id={sceneId}
      data-line-id={lineId}
      data-scene-assets={assetSummary}
      data-up-axis="z"
    >
      <MujocoProvider onError={(error) => onStatusChange("WASM 初始化失败：" + error.message)}>
        <MujocoCanvas
          key={`${sceneId}-${resetToken}`}
          config={config}
          paused={false}
          speed={mode === "playing" ? 1 : 0}
          shadows
          camera={{ position: [3.4, -4.2, 3.8], fov: 36, near: 0.01, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          onCreated={({ camera }) => {
            camera.up.set(0, 0, 1);
            camera.lookAt(0, 0, 0.68);
            camera.updateProjectionMatrix();
          }}
          onReady={() => onStatusChange(`${armCount} × Panda 与 ${lineId === "line2" ? "Line2" : "Line1"} 工位已加载`)}
          onError={(error) => onStatusChange("场景加载失败：" + error.message)}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={[lineId === "line2" ? "#161b1e" : "#07111d"]} />
          <fog attach="fog" args={[lineId === "line2" ? "#161b1e" : "#07111d", 5.5, 13]} />
          <ambientLight intensity={lineId === "line2" ? 0.9 : 1.15} />
          <directionalLight position={[3, -2, 6]} intensity={lineId === "line2" ? 1.8 : 2.4} castShadow />
          <directionalLight position={[-4, 2, 3]} intensity={lineId === "line2" ? 0.55 : 1.2} color={lineId === "line2" ? "#d2c4ad" : "#68d8ff"} />
          <gridHelper
            args={[7, 35, lineId === "line2" ? "#465156" : "#1f5368", lineId === "line2" ? "#2a3236" : "#102c3b"]}
            position={[0, 0, 0.006]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Suspense fallback={null}>
            {lineId === "line2" ? <RealisticAssetLayer sceneId={sceneId} /> : null}
          </Suspense>
          <ScenarioMotionController active={mode === "playing"} lineId={lineId} sceneId={sceneId} />
          <SceneReadySignal message={armCount + " × Panda 与 " + (lineId === "line2" ? "Line2" : "Line1") + " 工位已加载"} onReady={onStatusChange} />
          <OrbitControls
            makeDefault
            target={[0, 0, 0.62]}
            minDistance={2.4}
            maxDistance={7}
            minPolarAngle={0.35}
            maxPolarAngle={1.42}
            enableDamping
          />
        </MujocoCanvas>
      </MujocoProvider>
      <div className="loading-corner">
        <span className="loading-pulse" />
        {mode === "playing" ? "TASK MOTION ACTIVE" : "SCENE READY"}
      </div>
    </div>
  );
}
