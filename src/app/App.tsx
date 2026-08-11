import { useEffect, useState } from "react";
import { getScenario, getScenarios } from "../scenarios/line2Catalog";
import { SceneViewport, type PreviewMode } from "./SceneViewport";
import { LineSelector } from "./LineSelector";
import {
  readDemoLocation,
  writeDemoLocation,
  type LineId,
  type ScenarioId,
} from "./urlState";
import "../ui/theme/base.css";

export function App() {
  const initialLocation = readDemoLocation(window.location.search);
  const [lineId, setLineId] = useState<LineId>(initialLocation.lineId);
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>(initialLocation.sceneId);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("idle");
  const [resetToken, setResetToken] = useState(0);
  const [sceneStatus, setSceneStatus] = useState("正在初始化 Line2 场景");
  const scenario = getScenario(lineId, activeScenarioId);
  const scenarios = getScenarios(lineId);

  const resetScene = () => {
    setPreviewMode("idle");
    setResetToken((value) => value + 1);
    setSceneStatus(`正在复位${scenario.armLabel}场景`);
  };

  const updateLocation = (nextLineId: LineId, nextScenarioId: ScenarioId) => {
    window.history.replaceState(
      null,
      "",
      writeDemoLocation({ lineId: nextLineId, sceneId: nextScenarioId }),
    );
  };

  const selectScenario = (id: ScenarioId) => {
    const nextScenario = getScenario(lineId, id);
    setActiveScenarioId(id);
    setPreviewMode("idle");
    setResetToken((value) => value + 1);
    setSceneStatus(`正在初始化${nextScenario.armLabel}场景`);
    updateLocation(lineId, id);
  };

  const selectLine = (nextLineId: LineId) => {
    const nextScenario = getScenario(nextLineId, activeScenarioId);
    setLineId(nextLineId);
    setPreviewMode("idle");
    setResetToken((value) => value + 1);
    setSceneStatus(`正在初始化 ${nextLineId === "line2" ? "Line2" : "Line1"} ${nextScenario.armLabel}场景`);
    updateLocation(nextLineId, activeScenarioId);
  };

  useEffect(() => {
    const restoreLocation = () => {
      const next = readDemoLocation(window.location.search);
      setLineId(next.lineId);
      setActiveScenarioId(next.sceneId);
      setPreviewMode("idle");
      setResetToken((value) => value + 1);
    };
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, []);

  const previewLabel =
    previewMode === "playing" ? "运动预览中" : previewMode === "paused" ? "已暂停" : "待机";

  return (
    <main className="app-shell" data-line={lineId}>
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">M×</div>
        <div className="brand-copy">
          <h1>多机械臂协作演示平台</h1>
          <p>FRANKA PANDA · MULTI-ARM WORKCELL</p>
        </div>
        <LineSelector activeLine={lineId} onSelect={selectLine} />
        <div className="topbar-context">
          <span>{lineId === "line2" ? "场景与任务路径预览" : "原始场景构型"}</span>
          <strong>Demo {scenario.number}</strong>
        </div>
        <div className="system-chips">
          <span className="chip chip-live">● 本地 WebGL</span>
          <span className="chip chip-arm">{scenario.armCount} × Franka Panda</span>
          <span className="chip chip-alpha">{lineId === "line2" ? "LINE 2" : "LINE 1"}</span>
        </div>
      </header>

      <nav className="scenario-tabs" aria-label="六个演示场景">
        {scenarios.map((candidate) => (
          <button
            className={candidate.id === activeScenarioId ? "scenario-tab is-active" : "scenario-tab"}
            key={candidate.id}
            onClick={() => selectScenario(candidate.id)}
          >
            <span className="scenario-id">{candidate.number}</span>
            <span>
              <strong>{candidate.tabTitle}</strong>
              <small>{candidate.armLabel} · 场景已接通</small>
            </span>
          </button>
        ))}
      </nav>

      <section className="workspace">
        <section className="stage-card">
          <div className="stage-header">
            <div>
              <span className="eyebrow">{scenario.eyebrow}</span>
              <h2>{scenario.title}</h2>
              <p>{scenario.subtitle}</p>
            </div>
            <div className="scene-state">
              <span className="state-dot" />
              <div>
                <small>SCENE STATUS</small>
                <strong>{sceneStatus}</strong>
              </div>
            </div>
          </div>

          <div className="viewport-wrap">
            <SceneViewport
              lineId={lineId}
              sceneId={scenario.id}
              armCount={scenario.armCount}
              mode={previewMode}
              resetToken={resetToken}
              onStatusChange={setSceneStatus}
            />
            <div className="viewport-hint">Z-UP 已校正 · 拖拽旋转 · 滚轮缩放 · 真实 Franka MJCF</div>
            <div className="station-legend" aria-label="机械臂角色">
              {scenario.arms.map((arm) => (
                <div className={"arm-legend " + arm.color} key={arm.id}>
                  <span className="arm-led" />
                  <div>
                    <strong>{arm.id} · {arm.role}</strong>
                    <small>{arm.detail}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="mission-panel">
          <div className="panel-section mission-current">
            <span className="panel-kicker">CURRENT REVIEW / 当前检查</span>
            <div className="mission-title">
              <span className="mission-code">{scenario.missionCode}</span>
              <div>
                <strong>{scenario.missionTitle}</strong>
                <p>{scenario.missionCopy}</p>
              </div>
            </div>
            <div className="progress-line"><span /></div>
            <div className="stage-steps">
              <span className="done">资产</span>
              <span className="done">工位</span>
              <span className="active">运动</span>
              <span>任务闭环</span>
            </div>
          </div>

          <div className="panel-section">
            <span className="panel-kicker">OBJECT FLOW / 物料流</span>
            <div className="object-head"><span>对象</span><span>动作</span><span>目标</span><span>状态</span></div>
            {scenario.parts.map((part) => (
              <div className="object-row" data-testid="workpiece" key={part.id}>
                <strong>{part.id}</strong>
                <span>{part.task}</span>
                <span>{part.target}</span>
                <small className={part.fault ? "fault-text" : ""}>{part.state}</small>
              </div>
            ))}
          </div>

          <div className="panel-section">
            <span className="panel-kicker">DESTINATIONS / 分流位</span>
            <div className="destination-grid">
              {scenario.destinations.map((destination) => (
                <div className={`destination is-${destination.tone}`} key={destination.title}>
                  <strong>{destination.title}</strong><small>{destination.detail}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section evidence">
            <span className="panel-kicker">VISIBLE EQUIPMENT / 可见设备</span>
            <ul>
              {scenario.equipment.map((item, index) => (
                <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>
              ))}
            </ul>
          </div>

          <div className="playback">
            <div className="playback-status">
              <span className={"state-dot " + (previewMode === "playing" ? "is-playing" : "")} />
              <div><small>MOTION PREVIEW</small><strong data-testid="preview-status">{previewLabel}</strong></div>
            </div>
            <div className="playback-actions">
              <button aria-label="播放运动" onClick={() => setPreviewMode("playing")} disabled={previewMode === "playing"}>▶ 播放运动</button>
              <button aria-label="暂停运动" onClick={() => setPreviewMode("paused")} disabled={previewMode !== "playing"}>Ⅱ 暂停运动</button>
              <button aria-label="复位场景" onClick={resetScene}>↻ 复位场景</button>
            </div>
          </div>
        </aside>
      </section>

      <section className="arm-strip" aria-label={`${scenario.armCount} 条机械臂任务泳道`}>
        <div className="strip-title">
          <strong>机械臂任务泳道</strong>
          <span>六套工位均已接通，当前优先检查空间构型</span>
        </div>
        {scenario.arms.map((arm, index) => (
          <div className="lane" key={arm.id}>
            <div className={"lane-id " + arm.color}><span />{arm.id}<small>{arm.role}</small></div>
            <div className="lane-track">
              <i className={"segment segment-" + (index + 1) + "-a"}>{arm.segments[0]}</i>
              <i className={"segment segment-" + (index + 1) + "-b"}>{arm.segments[1]}</i>
            </div>
            <strong className="lane-state">{previewMode === "playing" ? "MOVING" : "READY"}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
