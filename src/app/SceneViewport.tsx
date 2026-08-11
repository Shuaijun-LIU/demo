import { OrbitControls } from "@react-three/drei";
import { MujocoCanvas, MujocoProvider, useBeforePhysicsStep } from "mujoco-react";
import { useMemo } from "react";

export type PreviewMode = "idle" | "playing" | "paused";

interface SceneViewportProps {
  mode: PreviewMode;
  resetToken: number;
  onStatusChange: (status: string) => void;
}

const ARM_HOME = [0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255];
const HOME_JOINTS = [...ARM_HOME, ...ARM_HOME, ...ARM_HOME];

function MotionPreview({ active }: { active: boolean }) {
  useBeforePhysicsStep((_model, data) => {
    if (!active) return;

    const time = data.time;
    for (let arm = 0; arm < 3; arm += 1) {
      const actuator = arm * 8;
      const phase = arm * 2.1;
      data.ctrl[actuator] = Math.sin(time * 0.55 + phase) * 0.32;
      data.ctrl[actuator + 1] = -0.7 + Math.sin(time * 0.72 + phase) * 0.14;
      data.ctrl[actuator + 2] = Math.sin(time * 0.43 + phase + 0.8) * 0.24;
      data.ctrl[actuator + 3] = -2.2 + Math.sin(time * 0.62 + phase) * 0.2;
      data.ctrl[actuator + 4] = Math.sin(time * 0.38 + phase) * 0.18;
      data.ctrl[actuator + 5] = 1.6 + Math.sin(time * 0.68 + phase + 0.4) * 0.16;
      data.ctrl[actuator + 6] = 0.78 + Math.sin(time * 0.45 + phase) * 0.22;
      data.ctrl[actuator + 7] = 180 + Math.sin(time * 1.1 + phase) * 55;
    }
  });

  return null;
}

function webGlAvailable() {
  return typeof window !== "undefined" && typeof window.WebGLRenderingContext !== "undefined";
}

export function SceneViewport({ mode, resetToken, onStatusChange }: SceneViewportProps) {
  const config = useMemo(
    () => ({
      src: new URL(".", document.baseURI).toString(),
      sceneFile: "scenarios/demo01/scene.xml",
      numArmJoints: 7,
      homeJoints: HOME_JOINTS,
    }),
    [],
  );

  if (!webGlAvailable()) {
    return (
      <div className="scene-viewport scene-fallback" data-testid="scene-viewport">
        <div className="fallback-cell">
          <span>3D WORKCELL</span>
          <strong>3 × Franka Panda</strong>
          <small>WebGL 浏览器中加载真实 MJCF 场景</small>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-viewport" data-testid="scene-viewport">
      <MujocoProvider onError={(error) => onStatusChange("WASM 初始化失败：" + error.message)}>
        <MujocoCanvas
          key={resetToken}
          config={config}
          paused={mode !== "playing"}
          speed={1}
          shadows
          camera={{ position: [3.4, -4.2, 3.8], fov: 36, near: 0.01, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          onReady={() => onStatusChange("3 × Panda 与工位已加载")}
          onError={(error) => onStatusChange("场景加载失败：" + error.message)}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#07111d"]} />
          <fog attach="fog" args={["#07111d", 4.5, 11]} />
          <ambientLight intensity={1.15} />
          <directionalLight position={[3, -2, 6]} intensity={2.4} castShadow />
          <directionalLight position={[-4, 2, 3]} intensity={1.2} color="#68d8ff" />
          <gridHelper args={[7, 35, "#1f5368", "#102c3b"]} position={[0, 0, 0.006]} />
          <MotionPreview active={mode === "playing"} />
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
        {mode === "playing" ? "JOINT PREVIEW ACTIVE" : "SCENE READY"}
      </div>
    </div>
  );
}
