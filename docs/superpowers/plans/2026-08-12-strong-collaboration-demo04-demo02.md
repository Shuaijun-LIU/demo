# Strong-Collaboration Demos 04 and 02 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付大型构件四臂装配和汽车线束四臂布线两个 strong-coupled 场景，证明多锚点保持、工具互锁、线束约束和故障复作业可由共享运行时可靠验收。

**Architecture:** Demo 04 先复用刚体、multi-anchor、HoldWhile 与选择性 MuJoCo 接触建立强协作模板；Demo 02 再增加确定性 Catmull-Rom 样条管线、控制点附件、RMS 与张力 oracle。两场都通过“禁用任意一臂即有必需谓词不可满足”证明机械臂必要性。

**Tech Stack:** 既有 React/TypeScript/Three/mujoco-react 运行时，Vitest 场景契约与 Playwright 浏览器测试。

## Global Constraints

- 必须先完成 Foundation 和刚体场景计划，且共享协调原语与 `runScenarioContract` 全部通过。
- Demo 04/02 的 `coordinationClass` 固定为 `strong-coupled`；禁臂验收不能用单纯动画时长替代。
- Demo 04 只有 F1/F2 导向接触启用选择性 MuJoCo；F2 到位开关失败属于业务故障，不得误记为 InfrastructureFault。
- Demo 02 不使用 MuJoCo 柔体；线束使用确定性样条管线与显式控制点 attachment。
- 强协作节点中任一必需保持/anchor 谓词失效，运行时必须进入 `BLOCKED_PAUSED` 并保持可解释的阻塞原因。
- fixture takeover 之前不得提前释放协作臂；takeover 后 custody 必须收敛为工装。
- 两个默认种子各恰好一个业务异常、零 InfrastructureFault，所有臂最终释放并回 safe pose。
- 所有长度统一用 mm、角度统一用 degree、模拟内部位置用 meter；转换只允许在 oracle 边界函数中发生。

---

## File Map

- `src/scenarios/demo04/*`：构件、紧固点、保持谓词、物理片段和装配 oracle。
- `src/simulation/splineHarness.ts`：纯函数线束状态、阻尼推进、采样、RMS 与张力。
- `src/simulation/splineHarnessView.tsx`：从同一状态绘制 TubeGeometry，不保存业务副本。
- `src/scenarios/demo02/*`：S0/S1、C1–C3、B1、三锚路由、C2 复压和线束 oracle。
- `src/scenarios/registry.ts`、`tests/e2e/strong-scenes.spec.ts`：模块懒加载与浏览器集成。

### Task 1: Demo 04 大型构件四臂装配

**Files:**
- Create: `src/scenarios/demo04/index.ts`
- Create: `src/scenarios/demo04/manifest.ts`
- Create: `src/scenarios/demo04/manifest.test.ts`
- Create: `src/scenarios/demo04/taskGraph.ts`
- Create: `src/scenarios/demo04/taskGraph.test.ts`
- Create: `src/scenarios/demo04/oracle.ts`
- Create: `src/scenarios/demo04/scene.tsx`
- Create: `src/scenarios/demo04/trajectories.ts`
- Create: `src/scenarios/demo04/physicsFragments.ts`
- Create: `src/scenarios/demo04/physicsFragments.test.ts`
- Create: `src/scenarios/demo04/demo04.contract.test.ts`
- Create: `public/scenarios/demo04/scene.xml`

**Interfaces:**
- Consumes: `claimMultiAnchor`、`transferToFixture`、`HoldWhile`、`ZoneLockManager`、`SimulationStateBridge`。
- Produces: `definition: ScenarioDefinition<Demo04State>`；`evaluateAssemblyTolerance`；稳定节点 `d04-four-arm-fixture`、`d04-f2-rework`、`d04-complete`。

- [ ] **Step 1: 写失败的几何和终态 oracle 测试**

~~~ts
it("accepts only the approved T-joint tolerances", () => {
  expect(evaluateAssemblyTolerance({ angleDeg: 92.9, positionErrorMm: 14.9 })).toEqual({
    angleOk: true, positionOk: true
  });
  expect(evaluateAssemblyTolerance({ angleDeg: 93.1, positionErrorMm: 15.1 })).toEqual({
    angleOk: false, positionOk: false
  });
  expect(manifest.oracle.expectedFinalState).toMatchObject({
    F1: { installed: true },
    F2: { installed: true },
    Seam: { scanned: true },
    assemblyCustody: { kind: "fixture", fixtureId: "assembly-jig" }
  });
});
~~~

Run: `npm run test:unit -- src/scenarios/demo04/manifest.test.ts`
Expected: FAIL，Demo 04 尚不存在。

- [ ] **Step 2: 实现 manifest 与装配对象初态**

显式创建 beam、plate、F1、F2、Seam、tool-head、back-support 和 assembly-jig；四条臂分别负责主梁保持、连接板定位、工具、背部支撑/扫描。`maxDemoDurationSec=120`；safe pose、基座、角色与工具完整声明。

- [ ] **Step 3: 写失败的三保持互锁测试**

~~~ts
it.each([
  ["beamHeldByArm1", false],
  ["plateHeldByArm2", false],
  ["backSupportByArm4", false]
])("blocks Arm 3 when %s is false", (metric, value) => {
  const runtime = makeDemo04RuntimeAt("d04-four-arm-fixture");
  runtime.patchMetric(metric, value);
  runtime.tick(20);
  expect(runtime.getSnapshot().status).toBe("BLOCKED_PAUSED");
  expect(runtime.lastBlockedReason()).toContain(metric);
  expect(runtime.eventsOfType("TOOL_STARTED")).toHaveLength(0);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo04/taskGraph.test.ts`
Expected: FAIL，工具互锁尚不存在。

- [ ] **Step 4: 实现强协作任务图**

节点顺序固定为 preflight、四臂取件/工具、beam/plate 定位、align barrier、`d04-four-arm-fixture`、F1 contact/install、F2 first contact/switch false、seam track/initial scan、`d04-f2-rework`、rescan、fixture takeover、release/return、`d04-complete`。Arm 3 进入任意工具节点前同时要求三条保持谓词、对齐容差和 tool-zone 锁。

- [ ] **Step 5: 写失败的业务/基础设施故障分离测试**

~~~ts
it("treats the first F2 switch miss as business evidence after valid contact", async () => {
  const result = await runF2FirstAttempt();
  expect(result.physics.outcome).toBe("committed");
  expect(result.events.filter(event => event.type === "SCRIPTED_BUSINESS_FAULT")).toHaveLength(1);
  expect(result.events.filter(event => event.type === "INFRASTRUCTURE_FAULT")).toHaveLength(0);
  expect(result.snapshot.metrics["F2.installed"]).toBe(false);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo04/physicsFragments.test.ts`
Expected: FAIL，F2 物理片段尚不存在。

- [ ] **Step 6: 实现三段选择性接触与 3D 工位**

F1 contact、F2 first contact、F2 rework 使用 bridge；每段先检查保持谓词与碰撞 mask，提交后才改变紧固件状态。F2 首次接触成功但业务开关为 false，复作业后 true。场景绘制梁、板、T 形基准、F1/F2、工具光环、背部支撑与扫描轨迹；不表现高温、飞溅或真实重载。

- [ ] **Step 7: 写并运行 Demo 04 契约**

~~~ts
runScenarioContract(definition, {
  expectedFaultId: "d04.f2-limit-switch",
  expectedFinalNodeId: "d04-complete"
});
~~~

Run: `npm run test:unit -- src/scenarios/demo04 && npm run test:contract -- src/scenarios/demo04/demo04.contract.test.ts`
Expected: 90°±3°、≤15 mm、F1/F2/Seam、fixture custody、故障一次、三次物理提交、四条禁臂、safe pose 和 reset 全部 PASS。

- [ ] **Step 8: 注册、运行浏览器纵切并提交**

把 Demo 04 动态 import 加到 registry；E2E 等待 `d04-four-arm-fixture → d04-f2-rework → d04-complete`，在 fixture 节点 reset 一次。

Run: `npm run build && npm run test:e2e -- tests/e2e/scenarios.spec.ts --grep "Demo 04"`
Expected: Demo 04 在 2× 下完成，结果显示角度、位置、F1/F2、Seam 全部 PASS。

~~~bash
git add src/scenarios/demo04 public/scenarios/demo04 src/scenarios/registry.ts tests/e2e
git commit -m "feat(scenarios): add four-arm structural assembly"
~~~

### Task 2: 确定性线束样条与指标

**Files:**
- Create: `src/simulation/splineHarness.ts`
- Create: `src/simulation/splineHarness.test.ts`
- Create: `src/simulation/splineHarnessView.tsx`
- Create: `src/simulation/splineHarnessView.test.tsx`

**Interfaces:**
- Consumes: `Vec3`。
- Produces: `HarnessPointId`、`HarnessControlPoint`、`HarnessSplineState`、`sampleHarnessCurve`、`rmsDistanceMm`、`normalizedTension`、`stepHarnessDamping`、`SplineHarnessView`。

- [ ] **Step 1: 写失败的固定步长确定性测试**

~~~ts
it("keeps constrained anchors exact and produces a stable hash", () => {
  let state = makeHarnessState();
  for (let step = 0; step < 120; step += 1) {
    state = stepHarnessDamping(state, targetPoints, 1 / 60);
  }
  expect(state.controlPoints.S0.position).toEqual(targetPoints.S0);
  expect(state.controlPoints.MID.position).toEqual(targetPoints.MID);
  expect(state.controlPoints.ROUTE.position).toEqual(targetPoints.ROUTE);
  expect(hashHarnessState(state)).toBe("c1a9d264");
});
~~~

Run: `npm run test:unit -- src/simulation/splineHarness.test.ts`
Expected: FAIL，样条模块尚不存在。首次实现若合法数值导致不同固定哈希，只在同一提交中把测试更新为实际稳定哈希并记录在 decision log，不允许每次运行漂移。

- [ ] **Step 2: 定义线束状态与单位**

~~~ts
export type HarnessPointId =
  | "S0" | "MID" | "ROUTE" | "C1" | "C2" | "B1" | "C3" | "S1";

export interface HarnessSplineState {
  readonly controlPoints: Readonly<Record<HarnessPointId, HarnessControlPoint>>;
  readonly restLengthMm: number;
  readonly damping: number;
}
~~~

每个点标记 `constraint: "free" | "arm" | "fixture"` 与 owner。固定点在阻尼更新中不移动；自由点使用半隐式、固定 dt 的阻尼过渡。

- [ ] **Step 3: 实现采样、RMS 与张力**

`sampleHarnessCurve(state, 64)` 使用 Catmull-Rom centripetal 曲线；`rmsDistanceMm` 对等长采样点按 meter→mm 转换；`normalizedTension` 基于当前弧长/静止长度映射并钳制 [0,1]。空数组、样本数不一致和非正 rest length 必须抛出明确错误。

- [ ] **Step 4: 实现无业务副本的 TubeGeometry 视图**

`SplineHarnessView` 只读取 `HarnessSplineState`，用 64 段 TubeGeometry 更新画面；旧 geometry 在替换/卸载时 dispose；颜色由 tension 区间传入，组件不修改控制点。

- [ ] **Step 5: 验证并提交**

Run: `npm run test:unit -- src/simulation/splineHarness.test.ts src/simulation/splineHarnessView.test.tsx`
Expected: 固定点、阻尼哈希、RMS 单位、张力边界、dispose 全部 PASS。

~~~bash
git add src/simulation/splineHarness*
git commit -m "feat(simulation): add deterministic spline harness"
~~~

### Task 3: Demo 02 汽车低压线束四臂布线

**Files:**
- Create: `src/scenarios/demo02/index.ts`
- Create: `src/scenarios/demo02/manifest.ts`
- Create: `src/scenarios/demo02/manifest.test.ts`
- Create: `src/scenarios/demo02/taskGraph.ts`
- Create: `src/scenarios/demo02/taskGraph.test.ts`
- Create: `src/scenarios/demo02/oracle.ts`
- Create: `src/scenarios/demo02/scene.tsx`
- Create: `src/scenarios/demo02/trajectories.ts`
- Create: `src/scenarios/demo02/demo02.contract.test.ts`
- Create: `public/scenarios/demo02/scene.xml`

**Interfaces:**
- Consumes: `HarnessSplineState`、multi-anchor custody、Barrier、ZoneLock、共享运行时。
- Produces: `definition: ScenarioDefinition<Demo02State>`；`evaluateHarnessOracle`；稳定节点 `d02-three-anchor-route`、`d02-c2-repress`、`d02-complete`。

- [ ] **Step 1: 写失败的终态线束 oracle 测试**

~~~ts
it("requires all connectors, clips, geometry and tension", () => {
  const result = evaluateHarnessOracle({
    S0: { locked: true }, S1: { locked: true },
    C1: { closed: true }, C2: { closed: true }, C3: { closed: true }, B1: { closed: true },
    rmsDistanceMm: 24.9, normalizedTension: 0.75
  });
  expect(result.ok).toBe(true);
  expect(evaluateHarnessOracle({
    S0: { locked: true }, S1: { locked: true },
    C1: { closed: true }, C2: { closed: true }, C3: { closed: true }, B1: { closed: true },
    rmsDistanceMm: 25.1, normalizedTension: 0.75
  }).ok).toBe(false);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo02/manifest.test.ts`
Expected: FAIL，oracle 尚不存在。

- [ ] **Step 2: 实现 manifest 与控制点初态**

线束 H-401 包含 S0/MID/ROUTE/C1/C2/B1/C3/S1；四条臂角色固定。`coordinationClass="strong-coupled"`、`maxDemoDurationSec=120`。终态要求 S0/S1 locked，C1/C2/C3/B1 closed，RMS≤25 mm，张力 [0.25,0.75]，所有臂释放回 safe pose。

- [ ] **Step 3: 写失败的三锚和压夹顺序测试**

~~~ts
it.each(["arm1", "arm2", "arm3"] as const)("blocks routing without %s anchor", armId => {
  const runtime = makeDemo02RuntimeAt("d02-three-anchor-route");
  runtime.removeHarnessAnchor(armId);
  runtime.tick(20);
  expect(runtime.getSnapshot().status).toBe("BLOCKED_PAUSED");
});

it("prevents Arm 4 from pressing a clip before the routed segment arrives", () => {
  const runtime = makeDemo02RuntimeAt("d02-route-c2-around-post");
  expect(runtime.requestClipPress("arm4", "C2")).toBe(false);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo02/taskGraph.test.ts`
Expected: FAIL，三锚图尚不存在。

- [ ] **Step 4: 实现强协作任务图**

固定节点：preflight、Arm 1 插入 S0、Arm 2 取得 MID、Arm 3 取得 ROUTE、`d02-three-anchor-route`、route/press C1、route around post/first press C2、route/press C3、Arm 3 直接插 S1、Arm 4 处理 B1、final scan、`d02-c2-repress`、rescan、fixture takeover、release/return、`d02-complete`。从三锚节点到 takeover，Arm 1–3 anchors 必须持续有效。

- [ ] **Step 5: 注入 C2 一次业务故障并连接样条场景**

C2 首压执行成功但 `closed=false`，final scan 发出 `d02.c2-not-seated` 一次，复压后 true。Arm 4 只有在当前 segment 到位并持 clip-zone 锁时可动作。scene 使用 `SplineHarnessView` 绘制线束、定位柱、S0/S1、C1–C3/B1、张力条和夹位灯；不调用 SimulationStateBridge。

- [ ] **Step 6: 写并运行场景契约**

~~~ts
runScenarioContract(definition, {
  expectedFaultId: "d02.c2-not-seated",
  expectedFinalNodeId: "d02-complete"
});
~~~

Run: `npm run test:unit -- src/scenarios/demo02 src/simulation/splineHarness.test.ts && npm run test:contract -- src/scenarios/demo02/demo02.contract.test.ts`
Expected: 三锚持续、压夹顺序、C2 单次复压、S0/S1、四夹位、RMS、张力、fixture custody、四条禁臂、safe pose、同种子和 reset 全部 PASS。

- [ ] **Step 7: 提交**

~~~bash
git add src/scenarios/demo02 public/scenarios/demo02
git commit -m "feat(scenarios): add four-arm harness routing"
~~~

### Task 4: 强协作场景集成与连续切换

**Files:**
- Modify: `src/scenarios/registry.ts`
- Modify: `src/scenarios/catalog.ts`
- Modify: `tests/e2e/scenarios.spec.ts`
- Create: `tests/e2e/strong-scenes.spec.ts`
- Modify: `project/task_plan.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`

**Interfaces:**
- Consumes: Demo 04/02 `definition`、`DemoPage`。
- Produces: 两个 ready 动态入口和强协作 E2E。

- [ ] **Step 1: 写失败的懒加载测试**

~~~ts
it.each(["demo04", "demo02"] as const)("loads strong scene %s", async id => {
  const loaded = await loadScenario(id);
  expect(loaded.manifest.id).toBe(id);
  expect(loaded.manifest.oracle.coordinationClass).toBe("strong-coupled");
});
~~~

Run: `npm run test:unit -- src/scenarios/registry.test.ts`
Expected: 至少 Demo 02 尚未注册。

- [ ] **Step 2: 注册 Demo 02/04 并保持按场景分包**

registry 使用显式动态 import；catalog 六卡现在全部 ready。构建输出必须保留独立 Demo 02/04 chunk，首页初始加载不触发其 MJCF 或 Three 场景资源请求。

- [ ] **Step 3: 写浏览器关键路径和切换隔离**

~~~ts
test("strong scenes expose collaboration, recovery and clean switching", async ({ page }) => {
  const demo = new DemoPage(page);
  await demo.openScenario("demo04");
  await demo.startAt2x();
  await demo.waitForNode("d04-four-arm-fixture");
  await demo.waitForNode("d04-f2-rework");
  await demo.waitForSuccess("d04-complete");
  await demo.switchTo("demo02");
  await demo.expectCleanInitialState("d02-preflight");
  await demo.startAt2x();
  await demo.waitForNode("d02-three-anchor-route");
  await demo.waitForNode("d02-c2-repress");
  await demo.waitForSuccess("d02-complete");
});
~~~

断言切换后旧 PiP、锁、anchor、事件、计数、runtime subscription 和 RAF 全部不存在。

- [ ] **Step 4: 运行 M4 阶段门**

Run: `npm run test:contract -- src/scenarios/demo04/demo04.contract.test.ts src/scenarios/demo02/demo02.contract.test.ts && npm run typecheck && npm run build && npm run test:e2e -- tests/e2e/strong-scenes.spec.ts`
Expected: 两场成功，业务异常各一次，InfrastructureFault 为零，浏览器无 page error/残留状态。

- [ ] **Step 5: 更新记录并提交**

~~~bash
git add src/scenarios/registry.ts src/scenarios/catalog.ts tests/e2e project
git commit -m "feat(scenarios): register strong-collaboration demos"
~~~
