# Rigid-Object Demos 03, 05, and 06 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已通过的共享运行时上交付食品装盒、智能药房和果品分选三个完整场景，并把三个默认种子纳入共享场景契约和浏览器回归。

**Architecture:** 三个场景共享基础工位几何和 pipeline-sla 契约，但各自保有类型化 manifest、任务图、轨迹、场景状态与 oracle。Demo 03/05 的短刚体落位复用 `SimulationStateBridge`；Demo 06 的果核分离使用确定性附件转换，不引入柔体或新物理后端。

**Tech Stack:** Foundation 计划锁定的 React 19、TypeScript 5.8、Three.js 0.181、mujoco-react 8.2.1、Vitest 2.1.9、Playwright 1.49.1。

## Global Constraints

- 必须先完成 `2026-08-12-foundation-demo01.md` 的全部阶段门。
- 三个场景均使用 `ScenarioDefinition`、`TaskRuntime`、`ScenarioSnapshot` 和 `runScenarioContract`；不得复制共享运行时。
- 默认种子业务异常恰好一次、InfrastructureFault 为零、所有对象唯一且库存守恒。
- Demo 03/05 物理片段必须 checkpoint、提交或完整回滚；Demo 06 不启用 MuJoCo 物理片段。
- 多臂必要性统一按 `pipeline-sla` 禁臂反事实验收：Demo 03/05 ≤90 秒，Demo 06 ≤100 秒。
- 所有工装与物料用本地 Three.js 基础几何，不新增外部请求或来源不清的资产。
- 每条臂 safe pose 必须在 manifest 显式声明并通过限位/碰撞检查。
- 场景完成前必须运行单元、契约、2× E2E 和生产构建。

---

## File Map

- `src/scenarios/shared/workcellPrimitives.tsx`：三个场景复用的地面、区域、托盘、货架、料箱、工装、检测台和状态灯。
- `src/scenarios/demo03/{index,manifest,taskGraph,oracle,scene,trajectories}.ts[x]`：食品五件装盒流程。
- `src/scenarios/demo05/{index,manifest,taskGraph,oracle,scene,trajectories}.ts[x]`：固定处方、错拣识别与补拣流程。
- `src/scenarios/demo06/{index,manifest,taskGraph,oracle,scene,trajectories}.ts[x]`：六果分选、去核与 G5 复作业流程。
- 每个场景的 `manifest.test.ts`、`taskGraph.test.ts`、`demoNN.contract.test.ts`：声明、分支和端到端 oracle。
- `src/scenarios/registry.ts`、`tests/e2e/scenarios.spec.ts`：一次性集成共享文件，减少并行冲突。

### Task 1: 可复用刚性工位 primitives

**Files:**
- Create: `src/scenarios/shared/workcellPrimitives.tsx`
- Create: `src/scenarios/shared/workcellPrimitives.test.tsx`

**Interfaces:**
- Consumes: React Three Fiber intrinsic elements、`Vec3`。
- Produces: `WorkcellFloor`、`SafetyZone`、`LabeledTray`、`LabeledRack`、`LabeledBin`、`Fixture`、`InspectionStation`、`StatusBeacon`、`TargetMarker`。

- [ ] **Step 1: 写失败的稳定标识与材质测试**

~~~tsx
it("renders bins with stable semantic object names", () => {
  const tree = renderThree(<LabeledBin id="return-bin" label="退回" color="#e59b38" />);
  expect(tree.getByObjectName("bin:return-bin")).toBeDefined();
  expect(tree.getByTextSprite("退回")).toBeDefined();
});
~~~

Run: `npm run test:unit -- src/scenarios/shared/workcellPrimitives.test.tsx`
Expected: FAIL，组件尚不存在。

- [ ] **Step 2: 实现共享组件**

每个组件必须设置 `name`、`userData.objectId` 和可测试的几何尺寸；状态色由属性传入。文字使用本地 CanvasTexture 缓存，卸载时释放，红色默认值不用于普通料箱。

- [ ] **Step 3: 验证并提交**

Run: `npm run test:unit -- src/scenarios/shared/workcellPrimitives.test.tsx`
Expected: 所有语义名称、尺寸、颜色和 dispose 测试 PASS。

~~~bash
git add src/scenarios/shared
git commit -m "feat(scenarios): add reusable workcell primitives"
~~~

### Task 2: Demo 03 食品多规格装盒

**Files:**
- Create: `src/scenarios/demo03/index.ts`
- Create: `src/scenarios/demo03/manifest.ts`
- Create: `src/scenarios/demo03/manifest.test.ts`
- Create: `src/scenarios/demo03/taskGraph.ts`
- Create: `src/scenarios/demo03/taskGraph.test.ts`
- Create: `src/scenarios/demo03/oracle.ts`
- Create: `src/scenarios/demo03/scene.tsx`
- Create: `src/scenarios/demo03/trajectories.ts`
- Create: `src/scenarios/demo03/demo03.contract.test.ts`
- Create: `public/scenarios/demo03/scene.xml`

**Interfaces:**
- Consumes: `ScenarioDefinition`、`HoldWhile`/`Barrier`/`Handoff`、`SimulationStateBridge`、共享 primitives。
- Produces: `definition: ScenarioDefinition<Demo03State>`；稳定节点 `d03-holdwhile-pack`、`d03-k3-ng`、`d03-complete`。

- [ ] **Step 1: 写失败的目标映射和故障测试**

~~~ts
it("declares all five package outcomes", () => {
  expect(manifest.oracle.expectedFinalState.destinations).toEqual({
    K1: "Blue-1",
    K2: "Yellow-1",
    K3: "NG",
    K4: "Yellow-2",
    K5: "Blue-2"
  });
  expect(manifest.oracle.scriptedFaultEvidence).toMatchObject({
    faultId: "d03.missing-date",
    objectId: "K3",
    evidenceNodeId: "d03-k3-missing-date-detected",
    expectedCount: 1
  });
});
~~~

Run: `npm run test:unit -- src/scenarios/demo03/manifest.test.ts`
Expected: FAIL，Demo 03 manifest 尚不存在。

- [ ] **Step 2: 实现类型化 manifest 和初态**

初态固定 K1/K3/K5 为 A，K2/K4 为 B；蓝盒三只、黄盒两只；三条 Panda safe pose 显式给出。`coordinationClass="pipeline-sla"`、`maxDemoDurationSec=90`。K3 的 `dateLabelPresent=false`，其余为 true；缺日期在封装后检测，不改变产品 SKU。

- [ ] **Step 3: 写失败的 Barrier/HoldWhile 任务图测试**

~~~ts
it("blocks insertion when Arm 2 stops holding the box", () => {
  const runtime = makeDemo03RuntimeAt("d03-holdwhile-pack");
  runtime.patchSnapshot({ metrics: { boxHeldOpenByArm2: false } });
  runtime.tick(20);
  expect(runtime.getSnapshot().status).toBe("BLOCKED_PAUSED");
  expect(runtime.getSnapshot().activeNodeId).toBe("d03-holdwhile-pack");
});
~~~

Run: `npm run test:unit -- src/scenarios/demo03/taskGraph.test.ts`
Expected: FAIL，任务图尚不存在。

- [ ] **Step 4: 实现五件流水任务图**

每件依次包含 `stage-product`、`open-box`、`ready Barrier`、`insert HoldWhile`、`close`、`handoff`、`seal`、`inspect`、`route`。K1 的装入节点命名 `d03-holdwhile-pack`。K3 固定走 `d03-k3-missing-date-detected → d03-k3-ng`；其他件按 A/Blue、B/Yellow 顺序到编号槽。下一件供料与当前件检测分流重叠。

- [ ] **Step 5: 连接轨迹、场景和选择性物理**

五次 insert 使用声明的物理 segment；每次成功提交盒体与产品的新位姿，失败恢复到 insert 前 custody。3D 工位显示供料、蓝/黄盒、装盒区、日期检测和 OK/NG 位置；`presentationCues` 绑定 `d03-holdwhile-pack`、`d03-k3-ng`、`d03-complete`。

- [ ] **Step 6: 写并运行场景契约**

~~~ts
runScenarioContract(definition, {
  expectedFaultId: "d03.missing-date",
  expectedFinalNodeId: "d03-complete",
  expectedDestinations: {
    K1: "Blue-1", K2: "Yellow-1", K3: "NG", K4: "Yellow-2", K5: "Blue-2"
  }
});
~~~

Run: `npm run test:unit -- src/scenarios/demo03/manifest.test.ts src/scenarios/demo03/taskGraph.test.ts && npm run test:contract -- src/scenarios/demo03/demo03.contract.test.ts`
Expected: K3 故障一次、HoldWhile 中断阻塞、五次物理提交、零 InfrastructureFault、90 秒与三条禁臂反事实全部 PASS。

- [ ] **Step 7: 提交**

~~~bash
git add src/scenarios/demo03 public/scenarios/demo03
git commit -m "feat(scenarios): add food packaging workflow"
~~~

### Task 3: Demo 05 智能药房错拣纠正

**Files:**
- Create: `src/scenarios/demo05/index.ts`
- Create: `src/scenarios/demo05/manifest.ts`
- Create: `src/scenarios/demo05/manifest.test.ts`
- Create: `src/scenarios/demo05/taskGraph.ts`
- Create: `src/scenarios/demo05/taskGraph.test.ts`
- Create: `src/scenarios/demo05/oracle.ts`
- Create: `src/scenarios/demo05/scene.tsx`
- Create: `src/scenarios/demo05/trajectories.ts`
- Create: `src/scenarios/demo05/demo05.contract.test.ts`
- Create: `public/scenarios/demo05/scene.xml`

**Interfaces:**
- Consumes: `ZoneLockManager`、`BarrierCoordinator`、`SimulationStateBridge`、共享 primitives。
- Produces: `definition: ScenarioDefinition<Demo05State>`；稳定节点 `d05-rx02-b3-detected`、`d05-rx02-corrected`、`d05-complete`。

- [ ] **Step 1: 写失败的处方和守恒测试**

~~~ts
it("uses the approved RX-20260812 prescriptions", () => {
  expect(createInitialState("RX-20260812").orders).toEqual({
    "RX-01": { required: ["A1-01", "B2-01"], status: "PENDING" },
    "RX-02": { required: ["A2-01", "B1-01", "C1-01"], status: "PENDING" }
  });
  expect(totalBoxCount(createInitialState("RX-20260812"))).toBe(12);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo05/manifest.test.ts`
Expected: FAIL，处方状态尚不存在。

- [ ] **Step 2: 实现 manifest 与唯一对象库存**

固定种子 `RX-20260812`。A1/A2/B1/B2/B3/C1 各两盒，共 12 个唯一 ID。最终 RX-01 仅含 A1-01/B2-01；RX-02 仅含 A2-01/B1-01/C1-01；B3-01 在 return-bin；每个 SKU 货架余一盒。所有药盒标记 `emptyDemoBox=true`。

- [ ] **Step 3: 写失败的包装锁与恢复责任测试**

~~~ts
it("does not grant Arm 4 the packaging zone before PASS", () => {
  const runtime = makeDemo05RuntimeAt("d05-rx02-b3-detected");
  expect(runtime.requestZone("arm4", "packaging-zone")).toBe(false);
  runtime.runUntil("d05-rx02-corrected");
  expect(runtime.requestZone("arm4", "packaging-zone")).toBe(true);
  expect(runtime.eventsFor("B3-01", "RETURNED").at(-1)?.armId).toBe("arm3");
  expect(runtime.eventsFor("B1-01", "PICKED").at(-1)?.armId).toBe("arm2");
});
~~~

Run: `npm run test:unit -- src/scenarios/demo05/taskGraph.test.ts`
Expected: FAIL，恢复链尚不存在。

- [ ] **Step 4: 实现两单并行与纠错图**

RX-01：Arm 1/2 并行取 A1/B2，Arm 3 汇合扫码，PASS 后 Arm 4 包装交付。RX-02：Arm 1 取 A2，Arm 2 固定错取 B3 并随后取 C1，Arm 3 在 `d05-rx02-b3-detected` 移出 B3，Arm 2 在 `d05-rx02-pick-b1` 补 B1，`d05-rx02-corrected` 后才允许 Arm 4 包装。RX-01 包装与 RX-02 拣选重叠。

- [ ] **Step 5: 连接六次落位与药房工位**

A1、B2、A2、B3、C1、B1 六次汇合盘落位走选择性物理；工位绘制 A/B/C 货架、两张订单汇合盘、扫码位、return bin、包装区与取药窗口。`presentationCues` 绑定检测、纠正和完成节点。

- [ ] **Step 6: 写并运行场景契约**

~~~ts
runScenarioContract(definition, {
  seed: "RX-20260812",
  expectedFaultId: "d05.wrong-pick-b3",
  expectedFinalNodeId: "d05-complete"
});
~~~

Run: `npm run test:unit -- src/scenarios/demo05/manifest.test.ts src/scenarios/demo05/taskGraph.test.ts && npm run test:contract -- src/scenarios/demo05/demo05.contract.test.ts`
Expected: 12=货架6+订单5+退回1，B3 仅由 Arm 3 退回、B1 仅由 Arm 2 补取、两单 PASS、故障一次、零基础设施故障、90 秒和四条禁臂测试全部 PASS。

- [ ] **Step 7: 提交**

~~~bash
git add src/scenarios/demo05 public/scenarios/demo05
git commit -m "feat(scenarios): add pharmacy correction workflow"
~~~

### Task 4: Demo 06 果品分选、去核与复作业

**Files:**
- Create: `src/scenarios/demo06/index.ts`
- Create: `src/scenarios/demo06/manifest.ts`
- Create: `src/scenarios/demo06/manifest.test.ts`
- Create: `src/scenarios/demo06/taskGraph.ts`
- Create: `src/scenarios/demo06/taskGraph.test.ts`
- Create: `src/scenarios/demo06/oracle.ts`
- Create: `src/scenarios/demo06/scene.tsx`
- Create: `src/scenarios/demo06/trajectories.ts`
- Create: `src/scenarios/demo06/demo06.contract.test.ts`
- Create: `public/scenarios/demo06/scene.xml`

**Interfaces:**
- Consumes: `ObjectCustody`、`ZoneLockManager`、共享 primitives。
- Produces: `definition: ScenarioDefinition<Demo06State>`；稳定节点 `d06-parallel-process`、`d06-g5-rework`、`d06-complete`。

- [ ] **Step 1: 写失败的分类与故障区分测试**

~~~ts
it("treats G2 and G4 as quality classes, not scripted faults", () => {
  const result = runDemo06ToCompletion();
  expect(result.destinations).toMatchObject({
    G1: "product-slot-1", G2: "unripe-bin", G3: "product-slot-2",
    G4: "ng-bin", G5: "product-slot-3", G6: "product-slot-4"
  });
  expect(result.businessFaults).toEqual(["d06.g5-pit-review-failed"]);
});
~~~

Run: `npm run test:unit -- src/scenarios/demo06/manifest.test.ts`
Expected: FAIL，场景尚不存在。

- [ ] **Step 2: 实现初态、附件和 oracle**

G1/G3/G5/G6 各自带唯一 pit attachment；G2 标记 unripe，G4 标记 surface-defect。最终四个合格果 `pitRemoved=true` 并占据四个成品槽，四枚 pit 在 pit-bin，G2/G4 分别在待熟/NG。`coordinationClass="pipeline-sla"`，`maxDemoDurationSec=100`。

- [ ] **Step 3: 写失败的 G5 单次复作业测试**

~~~ts
it("fails G5 review once and restores pit attachments on reset", () => {
  const runtime = makeDemo06Runtime();
  runtime.runUntil("d06-g5-rework");
  expect(runtime.getSnapshot().faultCounts["d06.g5-pit-review-failed"]).toBe(1);
  runtime.runToCompletion();
  expect(runtime.getSnapshot().faultCounts["d06.g5-pit-review-failed"]).toBe(1);
  runtime.reset();
  expect(runtime.getSnapshot().custody["pit-G5"]).toMatchObject({
    kind: "fixture", fixtureId: "fruit:G5"
  });
});
~~~

Run: `npm run test:unit -- src/scenarios/demo06/taskGraph.test.ts`
Expected: FAIL，复作业与 reset 尚不存在。

- [ ] **Step 4: 实现确定性流水图**

Arm 1 检查/初分，Arm 2 取得去核夹具 ZoneLock 后定向去核，Arm 3 复核/装盘。G2 直接待熟、G4 直接 NG。G5 首次去核后固定进入 `d06-g5-verify-failed → d06-g5-rework → reverify`。`d06-parallel-process` 同时包含 Arm 1 检查 G6、Arm 2 复作业 G5、Arm 3 装盘 G3 的活动。

- [ ] **Step 5: 实现确定性果核分离视觉**

用 custody/attachment 原子转换把 pit 从 fruit fixture 转移到 Arm 2，再到 pit-bin；不调用 SimulationStateBridge。3D 场景显示浅盘、旋转检查、去核工装、透明四格成品盘、待熟/NG/pit bins，并常驻“模型物料”标签。

- [ ] **Step 6: 写并运行场景契约**

~~~ts
runScenarioContract(definition, {
  expectedFaultId: "d06.g5-pit-review-failed",
  expectedFinalNodeId: "d06-complete"
});
~~~

Run: `npm run test:unit -- src/scenarios/demo06/manifest.test.ts src/scenarios/demo06/taskGraph.test.ts && npm run test:contract -- src/scenarios/demo06/demo06.contract.test.ts`
Expected: 四果、四核、待熟一、NG 一；G2/G4 零 fault event；G5 复作业一次；100 秒、三条禁臂、同种子哈希和 reset attachment 全部 PASS。

- [ ] **Step 7: 提交**

~~~bash
git add src/scenarios/demo06 public/scenarios/demo06
git commit -m "feat(scenarios): add fruit pitting workflow"
~~~

### Task 5: 三场景注册与共享浏览器回归

**Files:**
- Modify: `src/scenarios/registry.ts`
- Modify: `src/scenarios/catalog.ts`
- Modify: `tests/e2e/scenarios.spec.ts`
- Create: `tests/e2e/rigid-scenes.spec.ts`
- Modify: `project/task_plan.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`

**Interfaces:**
- Consumes: 三个 `definition` 与 `DemoPage`。
- Produces: `loadScenario("demo03"|"demo05"|"demo06")` 懒加载分支；参数化 E2E。

- [ ] **Step 1: 写失败的注册表测试**

~~~ts
it.each(["demo03", "demo05", "demo06"] as const)("lazy-loads %s", async id => {
  const definition = await loadScenario(id);
  expect(definition.manifest.id).toBe(id);
  expect(getScenario(id)?.status).toBe("ready");
});
~~~

Run: `npm run test:unit -- src/scenarios/registry.test.ts`
Expected: FAIL，三个场景仍为 planned。

- [ ] **Step 2: 注册三个独立动态 import**

只在 `registry.ts` 增加显式 `import("./demoNN")` 映射，并把 catalog 状态切为 ready；不得把三个大场景打进首页初始 chunk。

- [ ] **Step 3: 扩展参数化浏览器测试**

~~~ts
for (const scenario of [
  { id: "demo03", fault: "d03-k3-ng", complete: "d03-complete", result: "OK 4 / NG 1" },
  { id: "demo05", fault: "d05-rx02-b3-detected", complete: "d05-complete", result: "RX-01 PASS · RX-02 PASS" },
  { id: "demo06", fault: "d06-g5-rework", complete: "d06-complete", result: "成品 4 · 待熟 1 · NG 1" }
] as const) {
  test(scenario.id + " completes at 2x", async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.openScenario(scenario.id);
    await demo.startAt2x();
    await demo.waitForNode(scenario.fault);
    await demo.waitForSuccess(scenario.complete);
    await demo.expectResultText(scenario.result);
  });
}
~~~

每场还在一个非平凡节点执行 UI reset 并断言同种子初态。

- [ ] **Step 4: 运行 M3 阶段门**

Run: `npm run test:contract -- src/scenarios/demo03/demo03.contract.test.ts src/scenarios/demo05/demo05.contract.test.ts src/scenarios/demo06/demo06.contract.test.ts && npm run typecheck && npm run build && npm run test:e2e -- tests/e2e/rigid-scenes.spec.ts`
Expected: 三个场景全部成功；浏览器无残留节点/计数、无外部请求、无 page error。

- [ ] **Step 5: 更新记录并提交**

~~~bash
git add src/scenarios/registry.ts src/scenarios/catalog.ts tests/e2e project
git commit -m "feat(scenarios): register rigid-object investor demos"
~~~
