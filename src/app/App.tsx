import { useState } from "react";
import { SceneViewport, type PreviewMode } from "./SceneViewport";
import "../ui/theme/base.css";

const SCENARIOS = [
  ["01", "精密元器件", "三臂"],
  ["02", "汽车线束", "四臂"],
  ["03", "食品装盒", "三臂"],
  ["04", "大型构件", "四臂"],
  ["05", "智能药房", "三臂"],
  ["06", "岭南果品", "三臂"],
] as const;

const PARTS = [
  { id: "P1", task: "双臂交接", target: "A1", state: "READY" },
  { id: "P2", task: "双面检测", target: "B1", state: "QUEUED" },
  { id: "P3", task: "背标复核", target: "NG", state: "FAULT SCRIPT" },
  { id: "P4", task: "功能测试", target: "B2", state: "QUEUED" },
  { id: "P5", task: "功能测试", target: "A2", state: "QUEUED" },
] as const;

const ARMS = [
  { id: "ARM 1", role: "上料", detail: "混料盘 → 交接区", color: "cyan" },
  { id: "ARM 2", role: "双面检测", detail: "交接区 → 视觉工位", color: "violet" },
  { id: "ARM 3", role: "测试分拣", detail: "测试台 → A / B / NG", color: "amber" },
] as const;

export function App() {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("idle");
  const [resetToken, setResetToken] = useState(0);
  const [sceneStatus, setSceneStatus] = useState("正在初始化三臂场景");

  const resetScene = () => {
    setPreviewMode("idle");
    setResetToken((value) => value + 1);
    setSceneStatus("正在复位三臂场景");
  };

  const previewLabel =
    previewMode === "playing" ? "运动预览中" : previewMode === "paused" ? "已暂停" : "待机";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">M×</div>
        <div className="brand-copy">
          <h1>多机械臂协作演示平台</h1>
          <p>FRANKA PANDA · MULTI-ARM WORKCELL</p>
        </div>
        <div className="topbar-context">
          <span>场景构型检查</span>
          <strong>Demo 01</strong>
        </div>
        <div className="system-chips">
          <span className="chip chip-live">● 本地 WebGL</span>
          <span className="chip chip-arm">3 × Franka Panda</span>
          <span className="chip chip-alpha">SCENE ALPHA</span>
        </div>
      </header>

      <nav className="scenario-tabs" aria-label="六个演示场景">
        {SCENARIOS.map(([id, title, arms], index) => (
          <button className={index === 0 ? "scenario-tab is-active" : "scenario-tab"} key={id} disabled={index !== 0}>
            <span className="scenario-id">{id}</span>
            <span>
              <strong>{title}</strong>
              <small>{arms} · {index === 0 ? "场景已接通" : "待接入"}</small>
            </span>
          </button>
        ))}
      </nav>

      <section className="workspace">
        <section className="stage-card">
          <div className="stage-header">
            <div>
              <span className="eyebrow">DEMO 01 / ELECTRONICS INSPECTION</span>
              <h2>精密元器件检测与上料</h2>
              <p>三臂环绕工位 · 五件物料 · 双面视觉检测 · 功能测试与分流</p>
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
              mode={previewMode}
              resetToken={resetToken}
              onStatusChange={setSceneStatus}
            />
            <div className="viewport-hint">拖拽旋转 · 滚轮缩放 · 真实 Franka MJCF</div>
            <div className="station-legend" aria-label="机械臂角色">
              {ARMS.map((arm) => (
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
              <span className="mission-code">3A</span>
              <div>
                <strong>三臂工位构型</strong>
                <p>优先确认基座、工位、料框与观察角度</p>
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
            {PARTS.map((part) => (
              <div className="object-row" data-testid="workpiece" key={part.id}>
                <strong>{part.id}</strong>
                <span>{part.task}</span>
                <span>{part.target}</span>
                <small className={part.id === "P3" ? "fault-text" : ""}>{part.state}</small>
              </div>
            ))}
          </div>

          <div className="panel-section">
            <span className="panel-kicker">DESTINATIONS / 分流位</span>
            <div className="destination-grid">
              <div className="destination is-green"><strong>A 合格品</strong><small>A1 / A2</small></div>
              <div className="destination is-amber"><strong>B 合格品</strong><small>B1 / B2</small></div>
              <div className="destination is-red"><strong>NG 隔离</strong><small>P3 缺陷</small></div>
            </div>
          </div>

          <div className="panel-section evidence">
            <span className="panel-kicker">VISIBLE EQUIPMENT / 可见设备</span>
            <ul>
              <li><span>01</span>混料输送线与 P1–P5</li>
              <li><span>02</span>双面视觉检测门架</li>
              <li><span>03</span>功能测试台与三向料框</li>
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

      <section className="arm-strip" aria-label="三条机械臂任务泳道">
        <div className="strip-title">
          <strong>机械臂任务泳道</strong>
          <span>先检查空间构型，任务时序随后接入</span>
        </div>
        {ARMS.map((arm, index) => (
          <div className="lane" key={arm.id}>
            <div className={"lane-id " + arm.color}><span />{arm.id}<small>{arm.role}</small></div>
            <div className="lane-track">
              <i className={"segment segment-" + (index + 1) + "-a"}>{index === 0 ? "FEED P1" : index === 1 ? "RECEIVE P1" : "TEST P1"}</i>
              <i className={"segment segment-" + (index + 1) + "-b"}>{index === 0 ? "PREP P2" : index === 1 ? "INSPECT P1" : "ROUTE A1"}</i>
            </div>
            <strong className="lane-state">{previewMode === "playing" ? "MOVING" : "READY"}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
