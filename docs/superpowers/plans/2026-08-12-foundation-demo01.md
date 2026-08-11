# Foundation and Demo 01 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可静态构建的 React/MuJoCo 多臂共享运行时，并交付能从初态运行到异常闭环与结果验收的三臂 Demo 01。

**Architecture:** 运行时以不可变 `ScenarioSnapshot` 为唯一真值，声明式 `TaskGraphDefinition` 通过谓词、协调原语与可回滚物理桥推进。React 只订阅运行时快照；MuJoCo 负责 Panda 与选择性接触，业务工艺与结果 oracle 留在场景模块。

**Tech Stack:** Node.js 18.19.1、npm 9.2.0、TypeScript 5.8.2、Vite 6.2.0、React 19.2.0、Three.js 0.181.0、React Three Fiber 9.5.0、mujoco-react 8.2.1、Vitest 2.1.9、Playwright 1.49.1。

## Global Constraints

- 六个场景统一使用 Franka Panda，底层名称必须使用 `arm1_` 至 `arm4_` 前缀；业务逻辑不得依赖固定关节索引。
- 默认演示不依赖后端、API Key、LLM、VLA 或实时网络；所有运行资产必须随静态构建发布。
- 静态部署目标是 HTTP(S)，不支持 `file://`；首版关闭 WASM threads。
- `mujoco-react` 固定为 8.2.1，提交 `package-lock.json`；升级必须经过六场景回归。
- Menagerie Franka 资产来自本地 commit `b846dd1`，Apache-2.0；复制资产时同时复制许可证并记录 SHA-256。
- 确定性编排由事件和谓词推进，不用剧本绝对时间作为业务真值。
- 唯一超时状态流为 `RUNNING → BLOCKED_PAUSED → RECOVERING | RESETTING`。
- ScriptedBusinessFault 面向观众且每场恰好一次；InfrastructureFault 不计入业务异常，默认验收种子必须为零。
- 暂停、继续、1×/2×、任意中间节点复位与同种子重新执行必须从同一 `TaskRuntime` 控制。
- 每个任务先写失败测试，再做最小实现；每个任务结束必须运行列出的验证命令并提交。

---

## File Map

- `package.json`、`package-lock.json`：固定工具链、运行依赖与所有验证脚本。
- `vite.config.ts`、`vitest.config.ts`、`vitest.contract.config.ts`、`tsconfig*.json`：Node 18 兼容构建和分层测试。
- `src/runtime/types.ts`：跨层值对象、快照、事件与展示 cue 的唯一类型源。
- `src/runtime/scenarioManifest.ts`、`src/scenarios/types.ts`：场景声明与模块边界。
- `src/runtime/predicateEvaluator.ts`、`taskGraph.ts`、`taskRuntime.ts`、`traceRecorder.ts`：确定性状态机。
- `src/runtime/objectCustody.ts`、`zoneLock.ts`、`barrier.ts`、`handoff.ts`：多臂协调原语。
- `src/simulation/snapshotHash.ts`、`simulationStateBridge.ts`：选择性物理原子提交与回滚。
- `src/robotics/robotAdapter.ts`、`frankaAdapter.ts`、`trajectoryPlayer.ts`、`toolAdapter.ts`：与机械臂品牌解耦的控制层。
- `scripts/sync-franka-assets.mjs`、`scripts/smoke-mujoco.mjs`、`src/robotics/multiFrankaScene.ts`：受许可资产、多实例 MJCF 与编译探针。
- `src/app/*`、`src/ui/*`、`src/scenarios/catalog.ts`、`registry.ts`：六卡首页和共享工位外壳。
- `src/scenarios/demo01/*`：电子元器件三臂场景的 manifest、任务图、轨迹、3D 工位和 oracle。
- `src/test/scenarioContract.ts`、`tests/e2e/*`：共享场景契约与浏览器纵切测试。

### Task 1: Node 18 工程基线与可测试应用壳

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.contract.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 浏览器入口 `#root`。
- Produces: `App(): JSX.Element`；npm scripts `dev`、`typecheck`、`build`、`test:unit`、`test:contract`、`test:e2e`、`test:all`。

- [ ] **Step 1: 写入固定依赖和测试配置**

~~~json
{
  "name": "multi-arm-investor-demo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=18.18 <19" },
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b --pretty false",
    "build": "tsc -b --pretty false && vite build",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:contract": "vitest run --config vitest.contract.config.ts",
    "test:e2e": "playwright test",
    "test:all": "npm run typecheck && npm run test:unit && npm run test:contract"
  },
  "dependencies": {
    "@react-three/drei": "10.7.7",
    "@react-three/fiber": "9.5.0",
    "mujoco-react": "8.2.1",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "three": "0.181.0"
  },
  "devDependencies": {
    "@playwright/test": "1.49.1",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/node": "22.10.5",
    "@types/react": "19.0.3",
    "@types/react-dom": "19.0.2",
    "@types/three": "0.181.0",
    "@vitejs/plugin-react": "4.3.4",
    "jsdom": "25.0.1",
    "typescript": "5.8.2",
    "vite": "6.2.0",
    "vitest": "2.1.9"
  }
}
~~~

Run: `npm install`
Expected: 生成锁定上述直接版本的 `package-lock.json`，无 Node engine 错误。

- [ ] **Step 2: 写失败的应用壳测试**

~~~tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the six-demo product identity", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "多机械臂协作演示平台" })).toBeVisible();
});
~~~

Run: `npm run test:unit -- src/app/App.test.tsx`
Expected: FAIL，模块 `./App` 尚不存在。

- [ ] **Step 3: 实现最小入口**

~~~tsx
export function App() {
  return (
    <main>
      <h1>多机械臂协作演示平台</h1>
      <p>Franka Panda · 六场景统一运行时</p>
    </main>
  );
}
~~~

`src/main.tsx` 使用 `createRoot(document.getElementById("root")!).render(<App />)`；Vite `base` 暂设为 `"./"`；Vitest 使用 `jsdom` 并加载 `@testing-library/jest-dom/vitest`。

- [ ] **Step 4: 验证基线**

Run: `npm run typecheck && npm run test:unit -- src/app/App.test.tsx && npm run build`
Expected: 1 个测试 PASS；`dist/index.html` 生成；无 TypeScript 错误。

- [ ] **Step 5: 提交**

~~~bash
git add package.json package-lock.json index.html tsconfig*.json vite.config.ts vitest*.ts src .gitignore
git commit -m "build: establish Node 18 web demo baseline"
~~~

### Task 2: 规范化场景类型与 manifest 校验

**Files:**
- Create: `src/runtime/types.ts`
- Create: `src/runtime/scenarioManifest.ts`
- Create: `src/runtime/scenarioManifest.test.ts`
- Create: `src/scenarios/types.ts`
- Create: `src/test/fixtures.ts`

**Interfaces:**
- Consumes: 无。
- Produces: `ScenarioId`、`ArmId`、`ScenarioSnapshot`、`RuntimeEvent`、`PresentationCue`、`ScenarioManifest`、`ScenarioOracle`、`ScenarioDefinition<TState>`、`validateScenarioManifest(manifest): ScenarioManifest`。

- [ ] **Step 1: 写失败的 schema 测试**

~~~ts
import { expect, it } from "vitest";
import { makeManifest } from "../test/fixtures";
import { validateScenarioManifest } from "./scenarioManifest";

it("rejects an arm count that disagrees with arm declarations", () => {
  const manifest = makeManifest({ armCount: 4 });
  expect(() => validateScenarioManifest(manifest)).toThrow(/armCount 4.*3 arms/);
});

it("rejects presentation cues that reference an unknown task node", () => {
  const manifest = makeManifest({
    presentationCues: [{
      nodeId: "missing-node",
      narrationZh: "交接开始",
      cameraCue: { id: "overview", position: [2, -2, 2], target: [0, 0, 0.5], durationMs: 450 },
      focusArmIds: ["arm1"]
    }]
  });
  expect(() => validateScenarioManifest(manifest)).toThrow(/missing-node/);
});
~~~

Run: `npm run test:unit -- src/runtime/scenarioManifest.test.ts`
Expected: FAIL，导出尚不存在。

- [ ] **Step 2: 定义跨层类型**

~~~ts
export type ScenarioId = "demo01" | "demo02" | "demo03" | "demo04" | "demo05" | "demo06";
export type ArmId = "arm1" | "arm2" | "arm3" | "arm4";
export type RuntimeStatus =
  | "READY" | "RUNNING" | "PAUSED" | "BLOCKED_PAUSED"
  | "RECOVERING" | "RESETTING" | "SUCCEEDED" | "ERROR";
export type Vec3 = readonly [number, number, number];

export interface ScenarioSnapshot {
  readonly scenarioId: ScenarioId;
  readonly seed: string;
  readonly prngState: number;
  readonly status: RuntimeStatus;
  readonly activeNodeId: string;
  readonly nodeElapsedSec: number;
  readonly simTimeSec: number;
  readonly speed: 1 | 2;
  readonly arms: Readonly<Partial<Record<ArmId, ArmState>>>;
  readonly objects: Readonly<Record<string, ObjectState>>;
  readonly custody: Readonly<Record<string, CustodyState>>;
  readonly locks: Readonly<Record<string, ArmId>>;
  readonly barriers: Readonly<Record<string, readonly ArmId[]>>;
  readonly tools: Readonly<Record<string, ToolState>>;
  readonly inventory: Readonly<Record<string, number>>;
  readonly metrics: Readonly<Record<string, number | boolean | string>>;
  readonly faultCounts: Readonly<Record<string, number>>;
}

export interface RuntimeEvent {
  readonly seq: number;
  readonly atSec: number;
  readonly type: string;
  readonly nodeId?: string;
  readonly armId?: ArmId;
  readonly objectId?: string;
  readonly details: Readonly<Record<string, unknown>>;
}
~~~

同文件定义 `Pose`、`ArmState`、`ObjectState`、`CustodyState`、`ToolState`、`CameraCue` 与 `PresentationCue`；所有数组和映射为 readonly。

- [ ] **Step 3: 实现 manifest 契约**

~~~ts
export interface ScenarioDefinition<TState = ScenarioSnapshot> {
  readonly manifest: ScenarioManifest;
  readonly taskGraph: TaskGraphDefinition;
  readonly trajectories: Readonly<Record<string, TrajectorySpec>>;
  readonly scene: ScenarioSceneDefinition;
  createInitialSnapshot(seed?: string): TState;
  evaluateOracle(snapshot: TState, events: readonly RuntimeEvent[]): OracleResult;
}

export interface ScenarioOracle {
  readonly initialState: Readonly<Record<string, unknown>>;
  readonly expectedFinalState: Readonly<Record<string, unknown>>;
  readonly inventoryConservation: readonly InventoryRule[];
  readonly scriptedFaultEvidence: ScriptedFaultEvidence;
  readonly safePoseByArm: Readonly<Partial<Record<ArmId, readonly number[]>>>;
  readonly coordinationClass: "strong-coupled" | "pipeline-sla";
  readonly armNecessityOracle: ArmNecessityOracle;
  readonly maxDemoDurationSec: number;
}

export interface ScenarioManifest {
  readonly schemaVersion: 1;
  readonly id: ScenarioId;
  readonly title: string;
  readonly industry: string;
  readonly investorPosition: string;
  readonly defaultSeed: string;
  readonly armCount: 3 | 4;
  readonly arms: readonly ArmConfig[];
  readonly taskNodeIds: readonly string[];
  readonly physicsSegments: readonly PhysicsSegmentDeclaration[];
  readonly presentationCues: readonly PresentationCue[];
  readonly oracle: ScenarioOracle;
}

export function validateScenarioManifest(manifest: ScenarioManifest): ScenarioManifest {
  if (manifest.armCount !== manifest.arms.length) {
    throw new Error("armCount " + manifest.armCount + " does not match " + manifest.arms.length + " arms");
  }
  const nodeIds = new Set(manifest.taskNodeIds);
  for (const cue of manifest.presentationCues) {
    if (!nodeIds.has(cue.nodeId)) throw new Error("Unknown cue node " + cue.nodeId);
    if (!cue.narrationZh.trim()) throw new Error("Empty narration for " + cue.nodeId);
  }
  return manifest;
}
~~~

校验还必须覆盖：场景 ID、3/4 臂范围、唯一 Arm ID、每臂 7 个安全关节、唯一节点和 cue、非空初终态、故障证据、守恒声明、`coordinationClass` 与对应 `armNecessityOracle`、正数时限。

- [ ] **Step 4: 验证与提交**

Run: `npm run test:unit -- src/runtime/scenarioManifest.test.ts && npm run typecheck`
Expected: schema 测试全部 PASS。

~~~bash
git add src/runtime src/scenarios/types.ts src/test/fixtures.ts
git commit -m "feat(runtime): define validated scenario contracts"
~~~

### Task 3: 对象保管、共享区、Barrier 与 Handoff

**Files:**
- Create: `src/runtime/objectCustody.ts`
- Create: `src/runtime/objectCustody.test.ts`
- Create: `src/runtime/zoneLock.ts`
- Create: `src/runtime/zoneLock.test.ts`
- Create: `src/runtime/barrier.ts`
- Create: `src/runtime/barrier.test.ts`
- Create: `src/runtime/handoff.ts`
- Create: `src/runtime/handoff.test.ts`

**Interfaces:**
- Consumes: `ArmId`、`CustodyState`、`ScenarioSnapshot`。
- Produces: `claimExclusive`、`beginHandoff`、`completeHandoff`、`claimMultiAnchor`、`transferToFixture`、`releaseCustody`；`ZoneLockManager`；`BarrierCoordinator`；`HandoffCoordinator`。

- [ ] **Step 1: 写失败的保管与协调测试**

~~~ts
it("converges a handoff to the receiving arm only after confirmation", () => {
  const held = claimExclusive(freeCustody("P1"), "arm1");
  const shared = beginHandoff(held, "arm1", "arm2");
  expect(shared).toMatchObject({ kind: "handoff", sender: "arm1", receiver: "arm2" });
  expect(() => completeHandoff(shared, false)).toThrow(/receiver/);
  expect(completeHandoff(shared, true)).toEqual({ kind: "exclusive", armId: "arm2" });
});

it("grants globally ordered zones without a wait cycle", () => {
  const locks = new ZoneLockManager(["feed", "handoff", "inspect"]);
  expect(locks.acquireMany("arm1", ["handoff", "inspect"])).toBe(true);
  expect(() => locks.acquireMany("arm2", ["inspect", "handoff"])).toThrow(/global order/);
});
~~~

Run: `npm run test:unit -- src/runtime/objectCustody.test.ts src/runtime/zoneLock.test.ts`
Expected: FAIL，协调模块尚不存在。

- [ ] **Step 2: 实现显式保管状态机**

~~~ts
export type CustodyState =
  | { readonly kind: "free" }
  | { readonly kind: "exclusive"; readonly armId: ArmId }
  | { readonly kind: "handoff"; readonly sender: ArmId; readonly receiver: ArmId }
  | { readonly kind: "multiAnchor"; readonly compositeId: string; readonly anchors: readonly Anchor[] }
  | { readonly kind: "fixture"; readonly fixtureId: string };
~~~

所有转换返回新对象；非法双持、重复 anchor、发送者不匹配和未确认接收均抛出 `CustodyConflictError`。演示层捕获该错误后进入 `BLOCKED_PAUSED`。

- [ ] **Step 3: 实现锁、屏障和交接协调器**

`ZoneLockManager` 按构造时区域顺序授锁并支持 `release(zone, armId)`、`releaseAll(armId)`、`snapshot()`、`restore()`；`BarrierCoordinator.arrive(barrierId, armId, required)` 只在所需集合全部到达时返回 true；`HandoffCoordinator` 组合 custody 转换并发出 `HANDOFF_STARTED`、`HANDOFF_COMPLETED` 事件。

- [ ] **Step 4: 验证冲突与幂等释放**

Run: `npm run test:unit -- src/runtime/objectCustody.test.ts src/runtime/zoneLock.test.ts src/runtime/barrier.test.ts src/runtime/handoff.test.ts`
Expected: 正常、冲突、multi-anchor、fixture takeover、乱序锁、重复释放测试全部 PASS。

- [ ] **Step 5: 提交**

~~~bash
git add src/runtime/objectCustody* src/runtime/zoneLock* src/runtime/barrier* src/runtime/handoff*
git commit -m "feat(runtime): add multi-arm coordination primitives"
~~~

### Task 4: 声明式任务图、唯一超时语义与确定性 trace

**Files:**
- Create: `src/runtime/taskGraph.ts`
- Create: `src/runtime/predicateEvaluator.ts`
- Create: `src/runtime/predicateEvaluator.test.ts`
- Create: `src/runtime/traceRecorder.ts`
- Create: `src/runtime/traceRecorder.test.ts`
- Create: `src/runtime/faultInjector.ts`
- Create: `src/runtime/taskRuntime.ts`
- Create: `src/runtime/taskRuntime.test.ts`

**Interfaces:**
- Consumes: `ScenarioSnapshot`、协调原语。
- Produces: `PredicateSpec`、`RuntimeCommand`、`TaskNode`、`TaskGraphDefinition`；`evaluatePredicate(spec, snapshot)`；`TaskRuntime.start/pause/resume/setSpeed/reset/tick/getSnapshot/getEvents/subscribe`。

- [ ] **Step 1: 写失败的推进、超时和恢复测试**

~~~ts
it("pauses on timeout and auto mode takes only the declared recovery edge", () => {
  const runtime = makeRuntime({
    initial: "pick",
    nodes: [{
      id: "pick",
      actors: ["arm1"],
      enterWhen: { op: "always" },
      onEnter: [],
      completeWhen: { op: "pathEquals", path: "metrics.grasped", value: true },
      timeoutSec: 1,
      onSuccess: "done",
      onTimeout: "recover"
    }, terminalNode("recover"), terminalNode("done")]
  });
  runtime.start();
  runtime.tick(1.01);
  expect(runtime.getSnapshot().status).toBe("BLOCKED_PAUSED");
  runtime.resume();
  expect(runtime.getSnapshot().activeNodeId).toBe("recover");
  expect(runtime.getEvents().map(event => event.type)).toContain("RECOVERY_STARTED");
});
~~~

Run: `npm run test:unit -- src/runtime/taskRuntime.test.ts`
Expected: FAIL，`TaskRuntime` 尚不存在。

- [ ] **Step 2: 定义可序列化任务图**

~~~ts
export type PredicateSpec =
  | { readonly op: "always" }
  | { readonly op: "all"; readonly items: readonly PredicateSpec[] }
  | { readonly op: "any"; readonly items: readonly PredicateSpec[] }
  | { readonly op: "not"; readonly item: PredicateSpec }
  | { readonly op: "pathEquals"; readonly path: string; readonly value: unknown }
  | { readonly op: "numberRange"; readonly path: string; readonly min: number; readonly max: number }
  | { readonly op: "elapsedAtLeast"; readonly seconds: number }
  | { readonly op: "custodyIs"; readonly objectId: string; readonly kind: CustodyState["kind"] }
  | { readonly op: "lockOwned"; readonly zoneId: string; readonly armId: ArmId };

export interface TaskNode {
  readonly id: string;
  readonly actors: readonly ArmId[];
  readonly enterWhen: PredicateSpec;
  readonly onEnter: readonly RuntimeCommand[];
  readonly completeWhen: PredicateSpec;
  readonly timeoutSec: number;
  readonly onSuccess?: string;
  readonly onTimeout?: string;
}
~~~

`RuntimeCommand` 至少覆盖 arm trajectory、gripper、tool、object patch、custody、zone、barrier、业务故障、物理片段和事件标记。

- [ ] **Step 3: 实现运行时状态机**

`tick(deltaSec)` 只接受有限非负值，以 `deltaSec * speed` 增加模拟时间；谓词满足才转边。`pause()` 不推进，`resume()` 从普通暂停回 `RUNNING`，从 `BLOCKED_PAUSED` 原子选择当前节点声明的恢复边并进入 `RECOVERING`。`reset()` 取消命令、释放锁和附件、重建同种子初态，可重复调用。

- [ ] **Step 4: 实现固定种子故障与 trace 哈希**

`FaultInjector` 以 `seed + faultId` 决定声明的唯一注入点，并拒绝第二次注入；`TraceRecorder` 为事件分配单调 `seq`，导出深冻结副本。两次同种子执行的快照哈希与事件序列必须相同，不实现任意时间点视频式回放。

- [ ] **Step 5: 验证所有状态路径**

Run: `npm run test:unit -- src/runtime/predicateEvaluator.test.ts src/runtime/traceRecorder.test.ts src/runtime/taskRuntime.test.ts`
Expected: 正常完成、暂停、2×、业务故障、基础设施故障、阻塞恢复、同种子重跑和任意节点 reset 全部 PASS。

- [ ] **Step 6: 提交**

~~~bash
git add src/runtime
git commit -m "feat(runtime): execute deterministic recoverable task graphs"
~~~

### Task 5: SimulationStateBridge 原子物理片段

**Files:**
- Create: `src/simulation/snapshotHash.ts`
- Create: `src/simulation/snapshotHash.test.ts`
- Create: `src/simulation/simulationStateBridge.ts`
- Create: `src/simulation/simulationStateBridge.test.ts`

**Interfaces:**
- Consumes: `ScenarioSnapshot`、`RuntimeEvent`。
- Produces: `PhysicsAdapter`、`PhysicsSegment`、`BridgeResult`、`SimulationStateBridge.runSegment(segment, snapshot)`、`hashSnapshot(snapshot)`。

- [ ] **Step 1: 写失败的提交与回滚测试**

~~~ts
it("restores the exact checkpoint before a deterministic fallback", async () => {
  const checkpoint = makeSnapshot();
  const adapter = fakePhysicsAdapter({ runOutcomes: ["fail", "fail"] });
  const result = await new SimulationStateBridge(adapter).runSegment(
    { id: "grasp-P1", settleSteps: 20, validate: validContact, fallback: placeKinematically },
    checkpoint
  );
  expect(result.outcome).toBe("fallback");
  expect(result.attempts).toBe(2);
  expect(adapter.restoredHashes).toEqual([hashSnapshot(checkpoint), hashSnapshot(checkpoint)]);
  expect(hashSnapshot(result.checkpoint)).toBe(hashSnapshot(checkpoint));
});
~~~

Run: `npm run test:unit -- src/simulation/simulationStateBridge.test.ts`
Expected: FAIL，桥接器尚不存在。

- [ ] **Step 2: 定义桥接协议**

~~~ts
export interface PhysicsAdapter {
  importSnapshot(snapshot: ScenarioSnapshot): Promise<void>;
  settle(steps: number): Promise<void>;
  run(segmentId: string): Promise<void>;
  validate(segment: PhysicsSegment): Promise<{ ok: boolean; reason?: string }>;
  exportSnapshot(base: ScenarioSnapshot): Promise<ScenarioSnapshot>;
  restore(snapshot: ScenarioSnapshot): Promise<void>;
}

export type BridgeResult =
  | { outcome: "committed"; attempts: 1 | 2; checkpoint: ScenarioSnapshot; snapshot: ScenarioSnapshot; events: readonly RuntimeEvent[] }
  | { outcome: "fallback"; attempts: 2; checkpoint: ScenarioSnapshot; snapshot: ScenarioSnapshot; events: readonly RuntimeEvent[] };
~~~

- [ ] **Step 3: 实现 checkpoint → copy → settle → run → validate → commit**

每次尝试前深冻结 checkpoint；成功只提交一次导出快照；失败完整恢复 qpos/qvel/ctrl、对象位姿/速度、custody/attachments、碰撞 mask、工具、PRNG、任务节点与模拟时间。第二次失败后才调用声明的运动学 fallback，并记录一个 `InfrastructureFault` 技术事件。

- [ ] **Step 4: 验证确定性哈希**

Run: `npm run test:unit -- src/simulation/snapshotHash.test.ts src/simulation/simulationStateBridge.test.ts`
Expected: 进入、首次提交、重试提交、两次失败回滚和 fallback 后的固定哈希全部 PASS。

- [ ] **Step 5: 提交**

~~~bash
git add src/simulation/snapshotHash* src/simulation/simulationStateBridge*
git commit -m "feat(simulation): bridge kinematic and MuJoCo state atomically"
~~~

### Task 6: 受许可 Franka 资产、四臂 MJCF 与 RobotAdapter

**Files:**
- Create: `scripts/sync-franka-assets.mjs`
- Create: `scripts/smoke-mujoco.mjs`
- Create: `public/models/franka/**`
- Create: `LICENSES/franka-emika-panda-Apache-2.0.txt`
- Create: `LICENSES/franka-assets.sha256.json`
- Create: `src/robotics/multiFrankaScene.ts`
- Create: `src/robotics/multiFrankaScene.test.ts`
- Create: `src/robotics/robotAdapter.ts`
- Create: `src/robotics/frankaAdapter.ts`
- Create: `src/robotics/frankaAdapter.test.ts`
- Create: `src/robotics/trajectoryPlayer.ts`
- Create: `src/robotics/trajectoryPlayer.test.ts`
- Create: `src/robotics/toolAdapter.ts`
- Create: `public/scenarios/demo01/scene.xml`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `mujoco-react.MujocoSimAPI`、`ArmId`、`Pose`。
- Produces: `buildMultiFrankaScene(arms): string`；`RobotAdapter`；`FrankaAdapter`；`TrajectoryPlayer.sample(id, t)`；`ToolAdapter`。

- [ ] **Step 1: 写失败的命名空间和适配器测试**

~~~ts
it("builds four independent Panda namespaces", () => {
  const xml = buildMultiFrankaScene(fourArmConfigs);
  for (const id of ["arm1", "arm2", "arm3", "arm4"]) {
    expect(xml).toContain('prefix="' + id + '_"');
  }
  expect(xml.match(/<attach /g)).toHaveLength(4);
});

it("addresses actuators by semantic prefixed names", () => {
  const api = fakeMujocoApi();
  const adapter = new FrankaAdapter("arm2", api);
  adapter.commandJoints([0, -0.7, 0, -2.2, 0, 1.6, 0.78]);
  expect(api.lastNamedCtrl).toMatchObject({ arm2_actuator1: 0, arm2_actuator2: -0.7 });
});
~~~

Run: `npm run test:unit -- src/robotics/multiFrankaScene.test.ts src/robotics/frankaAdapter.test.ts`
Expected: FAIL，机器人层尚不存在。

- [ ] **Step 2: 同步资产并生成哈希**

`sync-franka-assets.mjs --source <franka_emika_panda>` 只允许来源目录同时含 `panda.xml`、`hand.xml`、`assets/` 和 `LICENSE`；复制到 `public/models/franka`，把许可证复制到 `LICENSES`，对每个发布文件写 SHA-256、上游 commit `b846dd1`、许可证 `Apache-2.0`。运行：

~~~bash
node scripts/sync-franka-assets.mjs --source /data/private/user2/workspace/7.web-robot/1.source-repos/google-deepmind__mujoco_menagerie/franka_emika_panda
~~~

Expected: `public/models/franka/panda.xml`、mesh、许可证和稳定哈希清单生成。

- [ ] **Step 3: 实现原生 attach/prefix 场景生成器**

~~~ts
export function buildMultiFrankaScene(arms: readonly ArmConfig[]): string {
  const attached = arms.map(arm =>
    '<frame pos="' + arm.basePose.position.join(" ") + '" euler="' +
    arm.baseEuler.join(" ") + '"><attach model="panda" body="link0" prefix="' +
    arm.id + '_"/></frame>'
  ).join("");
  return '<mujoco model="multi_franka"><compiler angle="radian"/>' +
    '<asset><model name="panda" file="../../models/franka/panda.xml"/></asset>' +
    '<worldbody><geom type="plane" size="2 2 .1"/>' + attached +
    '</worldbody></mujoco>';
}
~~~

提交 Demo 01 的三臂 XML；测试还验证唯一 body/joint/actuator/site 名、7 轴关节限位和控制通道不串扰。

- [ ] **Step 4: 实现 RobotAdapter 与轨迹插值**

~~~ts
export interface RobotAdapter {
  reset(qpos: readonly number[]): void;
  moveToPose(pose: Pose, durationSec: number): Promise<void>;
  playJointTrajectory(trajectoryId: string): Promise<void>;
  setGripper(opening: number): void;
  attachObject(objectId: string): void;
  releaseObject(objectId: string): void;
  setTool(toolId: string): void;
  getState(): ArmState;
  cancel(): void;
}
~~~

`FrankaAdapter` 通过 `armN_` 语义名查询 actuator/site；`TrajectoryPlayer` 对关节关键帧做固定步长三次平滑插值，夹爪范围钳制到模型限位，`cancel` 后不得继续写 ctrl。

- [ ] **Step 5: 保留真实四臂 WASM 编译探针**

`scripts/smoke-mujoco.mjs` 把发布资产装入 MEMFS，编译四臂场景并断言 `nq=36`、`nv=36`、`nu=32`、`nbody=45`、`ngeom=325`，再逐组写 ctrl 并确认其他组不变。

Run: `npm run test:unit -- src/robotics && node scripts/smoke-mujoco.mjs`
Expected: 单测 PASS；探针输出 `{"ok":true,"nq":36,"nu":32}`。

- [ ] **Step 6: 提交**

~~~bash
git add scripts public/models public/scenarios/demo01 LICENSES src/robotics package*.json
git commit -m "feat(robotics): load independent Franka Panda instances"
~~~

### Task 7: 单一快照 store、六卡首页与共享工位 UI

**Files:**
- Create: `src/app/runtimeStore.ts`
- Create: `src/app/runtimeStore.test.ts`
- Modify: `src/app/App.tsx`
- Create: `src/app/DemoWorkspace.tsx`
- Create: `src/scenarios/catalog.ts`
- Create: `src/scenarios/registry.ts`
- Create: `src/ui/ScenarioGallery.tsx`
- Create: `src/ui/SceneViewport.tsx`
- Create: `src/ui/MissionPanel.tsx`
- Create: `src/ui/ArmSwimlanes.tsx`
- Create: `src/ui/PlaybackControls.tsx`
- Create: `src/ui/ResultSummary.tsx`
- Create: `src/ui/ui.test.tsx`
- Create: `src/ui/theme/base.css`

**Interfaces:**
- Consumes: `TaskRuntime.subscribe`、`ScenarioManifest`、`ScenarioSnapshot`。
- Produces: `RuntimeStore.getSnapshot/subscribe/attach/detach`；`listScenarios()`、`getScenario(id)`、`loadScenario(id)`；共享展示组件。

- [ ] **Step 1: 写失败的单真值和 UI 控制测试**

~~~tsx
it("renders mission and swimlanes from the same runtime snapshot", async () => {
  const runtime = makeDemoRuntime();
  render(<DemoWorkspace definition={demo01Definition} runtime={runtime} />);
  expect(screen.getByTestId("current-node")).toHaveAttribute("data-node-id", "d01-preflight");
  expect(screen.getByTestId("arm1-lane")).toHaveTextContent("等待");
  await userEvent.click(screen.getByTestId("playback-start"));
  expect(runtime.getSnapshot().status).toBe("RUNNING");
});
~~~

Run: `npm run test:unit -- src/app/runtimeStore.test.ts src/ui/ui.test.tsx`
Expected: FAIL，store 和组件尚不存在。

- [ ] **Step 2: 实现无第二份业务状态的 store**

`RuntimeStore` 用 `useSyncExternalStore` 暴露 `TaskRuntime.getSnapshot()`；场景切换先 `detach` 当前 runtime、取消轨迹并释放资源，再异步 `loadScenario`。UI 不复制对象计数、节点或 fault 状态。

- [ ] **Step 3: 实现六卡首页与 72/28 工位**

`catalog.ts` 固定六张卡片的标题、行业、臂数和定位；只有 Demo 01 在本阶段可加载，其余卡显示阶段状态但仍可阅读说明。`DemoWorkspace` 组合顶部控制、约 72% 舞台、28% 任务面板和底部 3/4 条泳道。按钮 test id 固定为 `playback-start`、`playback-pause`、`playback-resume`、`playback-speed-1`、`playback-speed-2`、`playback-reset`。

- [ ] **Step 4: 连接 MujocoCanvas 的本地 SceneConfig**

`SceneViewport` 使用 `src: new URL(".", document.baseURI).toString()` 与 `sceneFile: "scenarios/demo01/scene.xml"`，加载中显示实际进度，错误时显示资产名和重试。控制层只通过 `FrankaAdapter` 更新关节。

- [ ] **Step 5: 验证 UI 与控制语义**

Run: `npm run test:unit -- src/app/runtimeStore.test.ts src/ui/ui.test.tsx && npm run build`
Expected: 六卡可见；Demo 01 工位布局、启动/暂停/继续/倍速/复位测试 PASS；构建无外部 URL。

- [ ] **Step 6: 提交**

~~~bash
git add src/app src/scenarios/catalog.ts src/scenarios/registry.ts src/ui
git commit -m "feat(ui): add shared six-scene investor workspace"
~~~

### Task 8: Demo 01 三臂电子元器件闭环

**Files:**
- Create: `src/scenarios/demo01/index.ts`
- Create: `src/scenarios/demo01/manifest.ts`
- Create: `src/scenarios/demo01/manifest.test.ts`
- Create: `src/scenarios/demo01/taskGraph.ts`
- Create: `src/scenarios/demo01/taskGraph.test.ts`
- Create: `src/scenarios/demo01/trajectories.ts`
- Create: `src/scenarios/demo01/oracle.ts`
- Create: `src/scenarios/demo01/scene.tsx`
- Modify: `src/scenarios/registry.ts`

**Interfaces:**
- Consumes: `ScenarioDefinition`、任务图/协调/机器人/物理桥接口。
- Produces: `definition: ScenarioDefinition<ScenarioSnapshot>`，稳定节点 `d01-preflight`、`d01-handoff`、`d01-p3-ng`、`d01-complete`。

- [ ] **Step 1: 写失败的 manifest 与图测试**

~~~ts
it("declares the exact five-part disposition and one visible fault", () => {
  expect(manifest.oracle.expectedFinalState.objectDestinations).toEqual({
    P1: "A1", P2: "B1", P3: "NG", P4: "B2", P5: "A2"
  });
  expect(manifest.oracle.scriptedFaultEvidence).toEqual({
    faultId: "d01.p3-missing-back-mark",
    objectId: "P3",
    evidenceNodeId: "d01-p3-ng",
    expectedCount: 1
  });
  expect(manifest.oracle.coordinationClass).toBe("pipeline-sla");
  expect(manifest.oracle.maxDemoDurationSec).toBe(90);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo01/manifest.test.ts src/scenarios/demo01/taskGraph.test.ts`
Expected: FAIL，Demo 01 模块尚不存在。

- [ ] **Step 2: 固化任务节点与并行节拍**

任务图按 P1→P5 生成 feed、classify、handoff/inspect、functional-test、route 节点。P1 使用正式 `d01-handoff`：Arm 1 保持，Arm 2 闭合确认后 Arm 1 释放。P3 在背面检测节点注入 `d01.p3-missing-back-mark`，直接走 `d01-p3-ng`，绝不进入功能测试。Arm 1 准备下一件、Arm 2 检测当前件、Arm 3 测试/上料必须出现重叠区间。

- [ ] **Step 3: 定义场景状态、轨迹和物理片段**

`manifest.ts` 明确三条臂基座、角色、工具与 7 轴 safe pose `[0,-0.70,0,-2.20,0,1.60,0.78]`；P1–P5 初始位置唯一。`trajectories.ts` 为每个语义动作提供固定关键帧。刚性抓持与托盘落位走 `SimulationStateBridge`；默认种子每段一次提交且无 InfrastructureFault。

- [ ] **Step 4: 实现共享 oracle**

`evaluateOracle` 必须同时检查逐对象目的地、P3 未功能测试、5 件库存守恒、业务故障恰好一次、InfrastructureFault 为 0、三臂 safe pose、总模拟时间 ≤90 秒以及禁用每条臂的反事实结果。

- [ ] **Step 5: 实现 3D 工位**

`scene.tsx` 使用本地 Three 基础几何绘制混料盘、交接区、双面相机、功能测试台、A1/A2/B1/B2/NG 位；对象颜色由 SKU/检测状态决定，红色只在 P3 失败节点显示。`d01-handoff` 同时突出 Arm 1/2 和 P1。

- [ ] **Step 6: 验证场景单测**

Run: `npm run test:unit -- src/scenarios/demo01`
Expected: manifest、图分支、Handoff、P3 旁路、90 秒、safe pose 和默认物理片段测试全部 PASS。

- [ ] **Step 7: 提交**

~~~bash
git add src/scenarios/demo01 src/scenarios/registry.ts
git commit -m "feat(scenarios): deliver the electronics reference demo"
~~~

### Task 9: 共享场景契约与 Demo 01 浏览器纵切

**Files:**
- Create: `src/test/scenarioContract.ts`
- Create: `src/scenarios/demo01/demo01.contract.test.ts`
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers/demoPage.ts`
- Create: `tests/e2e/gallery.spec.ts`
- Create: `tests/e2e/scenarios.spec.ts`
- Create: `tests/e2e/playback.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `ScenarioDefinition`、公开 UI test id。
- Produces: `runScenarioContract(definition, options?)`；`DemoPage` 页面对象。

- [ ] **Step 1: 写失败的 Demo 01 契约**

~~~ts
runScenarioContract(definition, {
  expectedFaultId: "d01.p3-missing-back-mark",
  expectedFinalNodeId: "d01-complete",
  expectedDestinations: { P1: "A1", P2: "B1", P3: "NG", P4: "B2", P5: "A2" }
});
~~~

Run: `npm run test:contract -- src/scenarios/demo01/demo01.contract.test.ts`
Expected: FAIL，`runScenarioContract` 尚不存在。

- [ ] **Step 2: 实现场景契约 harness**

harness 运行默认种子直到终态，并断言臂数、每条臂禁用反事实、恰好一次业务故障、零 InfrastructureFault、逐对象终态、库存守恒、safe pose、时限和每个可达节点 reset 幂等；超出 manifest 时限立即失败。

- [ ] **Step 3: 写浏览器关键路径**

~~~ts
test("Demo 01 completes fault and recovery at 2x", async ({ page }) => {
  const demo = new DemoPage(page);
  await demo.openGallery();
  await demo.enter("demo01");
  await demo.start();
  await demo.setSpeed(2);
  await demo.waitForNode("d01-handoff");
  await demo.pauseAndAssertStable();
  await demo.resume();
  await demo.waitForNode("d01-p3-ng");
  await demo.waitForSuccess("d01-complete");
  await demo.expectResult({ OK: 4, NG: 1 });
});
~~~

另一个测试在非平凡中间节点点击 reset，断言回到 `d01-preflight`、同一 seed、P1–P5 初始位置、零锁和零附件。

- [ ] **Step 4: 运行阶段门**

Run: `npm run test:all && npm run build && npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/playback.spec.ts tests/e2e/scenarios.spec.ts --grep "Demo 01"`
Expected: 全部通过；浏览器无 page error、未处理 rejection 或非预期 console error。

- [ ] **Step 5: 更新项目记录并提交**

修改 `project/task_plan.md` 将 M0/M1/M2 标为完成；在 `project/standup_log.md` 记录测试数量和构建结果；`project/next_actions.md` 指向 Demo 03/05/06。

~~~bash
git add src/test src/scenarios/demo01 playwright.config.ts tests package*.json project
git commit -m "test: verify the Demo 01 end-to-end vertical slice"
~~~
