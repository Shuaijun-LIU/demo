import { useEffect, useState } from "react";
import { getVisualScenario, VISUAL_SCENARIOS } from "../scenarios/visualCatalog";
import { SceneViewport } from "./SceneViewport";
import { readDemoLocation, writeDemoLocation, type ScenarioId } from "./urlState";
import "../ui/theme/base.css";

export function App() {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>(
    () => readDemoLocation(window.location.search).sceneId,
  );
  const scenario = getVisualScenario(activeScenarioId);

  const selectScenario = (sceneId: ScenarioId) => {
    setActiveScenarioId(sceneId);
    window.history.replaceState(null, "", writeDemoLocation(sceneId));
  };

  useEffect(() => {
    const restoreLocation = () => {
      setActiveScenarioId(readDemoLocation(window.location.search).sceneId);
    };
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, []);

  return (
    <main className="app-shell">
      <nav className="scene-selector" aria-label="六个展示场景">
        {VISUAL_SCENARIOS.map((candidate) => (
          <button
            aria-label={`场景 ${candidate.number} ${candidate.tabTitle}`}
            aria-current={candidate.id === activeScenarioId ? "page" : undefined}
            className={candidate.id === activeScenarioId ? "scene-button is-active" : "scene-button"}
            key={candidate.id}
            onClick={() => selectScenario(candidate.id)}
          >
            <span>{candidate.number}</span>
            <strong>{candidate.tabTitle}</strong>
          </button>
        ))}
      </nav>

      <section className="showroom-stage">
        <div className="scene-meta">
          <div>
            <span>场景 {scenario.number}</span>
            <h2>{scenario.title}</h2>
            <p>{scenario.subtitle}</p>
          </div>
          <strong>{scenario.armCount} × Franka Panda</strong>
        </div>

        <div className="viewport-frame">
          <SceneViewport sceneId={scenario.id} armCount={scenario.armCount} />
          <div className="viewport-help">静态场景 · 拖动旋转 · 滚轮缩放</div>
        </div>
      </section>
    </main>
  );
}
