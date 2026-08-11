# Investor Polish, Static Deployment, and Full Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把六个已通过场景收束为可离线静态部署、视觉统一、自动讲解、可审计且达到目标机性能门槛的投资人展示版本。

**Architecture:** PresentationDirector 从运行时节点和 manifest cue 派生讲解/镜头，不维护业务副本；资源 scope 管理每个场景的加载与释放。构建使用相对 base 与 hash route，同一 dist 同时支持根路径和子路径；最终回归串联类型、单元、契约、E2E、视觉、离线、许可和性能证据。

**Tech Stack:** 已锁定的 Vite/React/Three/mujoco-react，Playwright Chromium 1920×1080，Node 脚本用于资产、许可证、部署与性能报告。

## Global Constraints

- 六个场景的业务逻辑、对象统计、讲解 cue 和结果面板都从同一 `ScenarioSnapshot`/manifest 读取。
- 桌面路演目标为 Chrome 1920×1080；宽度小于 960px 时不初始化 WebGL/WASM，只显示说明页。
- 主内容布局为 3D 约 72%、任务面板约 28%，顶部控制和底部全部泳道同时可见。
- 绿色表示通过，琥珀表示进行/等待，红色只表示真实异常、阻塞或加载失败。
- 所有模型、WASM、字体、图标和场景资产本地化；断网外部请求数必须为零。
- 静态部署使用 HTTP(S) 和 hash route；不支持 `file://`；首版不要求 COOP/COEP。
- 四臂连续 120 秒 FPS 中位数 ≥45、5th percentile ≥30；缓存切场景 ≤2.5 秒；三轮 heap 增长 ≤100 MiB。
- 页面明确“模型物料 / 仿真工具 / 非真实产线精度、认证或医疗合规结论”；Demo 05 额外显示“空盒演示”。
- 只有在完整回归命令真实通过后才能更新 `final_verification.md` 为完成。

---

## File Map

- `src/ui/presentation/*`、`src/simulation/cameraDirector.ts`：讲解、稳定镜头、机械臂聚焦和腕部 PiP。
- `src/ui/theme/*`、`src/ui/CapabilityFallback.tsx`：投资人控制台视觉与兼容状态。
- `src/simulation/resourceLifecycle.ts`：Three、MuJoCo、URL、订阅和 RAF 的统一释放。
- `LICENSES/*`、`scripts/audit-licenses.mjs`：来源、许可证与资产 SHA-256 审计。
- `src/app/hashRoute.ts`、`assetUrl.ts`、`scripts/static-server.mjs`、`audit-dist.mjs`：根/子路径静态部署。
- `tests/e2e/*`：功能、故障、离线、视觉、性能和三轮循环验证。
- `project/requirements_traceability.md`、`benchmark_env.md`、`final_verification.md`：可追溯交付证据。

### Task 1: 自动讲解、镜头 cue 与腕部画中画

**Files:**
- Modify: `src/runtime/types.ts`
- Modify: `src/runtime/scenarioManifest.ts`
- Modify: `src/simulation/cameraDirector.ts`
- Create: `src/simulation/cameraDirector.test.ts`
- Create: `src/ui/presentation/presentationDirector.ts`
- Create: `src/ui/presentation/presentationDirector.test.ts`
- Create: `src/ui/presentation/PresentationOverlay.tsx`
- Create: `src/ui/presentation/PresentationOverlay.test.tsx`
- Create: `src/ui/presentation/WristCameraPip.tsx`
- Create: `src/ui/presentation/WristCameraPip.test.tsx`
- Modify: `src/app/DemoWorkspace.tsx`

**Interfaces:**
- Consumes: `PresentationCue`、`ScenarioSnapshot`、`RuntimeEvent`、`CameraDirector`。
- Produces: `PresentationState`、`derivePresentationState(cues, snapshot, events)`、展示组件。

- [ ] **Step 1: 写失败的节点去重和 reset 测试**

~~~ts
it("fires a cue once per node entry and resets to overview", () => {
  const first = derivePresentationState(cues, snapshotAt("d01-handoff"), [nodeEntered("d01-handoff", 7)]);
  const duplicate = derivePresentationState(cues, snapshotAt("d01-handoff"), [nodeEntered("d01-handoff", 7)]);
  expect(first.transitionKey).toBe("d01-handoff:7");
  expect(duplicate.transitionKey).toBe("d01-handoff:7");
  const reset = derivePresentationState(cues, readySnapshot(), [runtimeReset(8)]);
  expect(reset).toMatchObject({ activeCue: null, narrationZh: null, wristPipArmId: null });
});
~~~

Run: `npm run test:unit -- src/ui/presentation/presentationDirector.test.ts`
Expected: FAIL，presentation director 尚不存在。

- [ ] **Step 2: 实现纯派生展示状态**

~~~ts
export interface PresentationState {
  readonly activeCue: PresentationCue | null;
  readonly narrationZh: string | null;
  readonly focusArmIds: readonly ArmId[];
  readonly wristPipArmId: ArmId | null;
  readonly transitionKey: string | null;
}

export function derivePresentationState(
  cues: readonly PresentationCue[],
  snapshot: ScenarioSnapshot,
  events: readonly RuntimeEvent[]
): PresentationState;
~~~

manifest 校验拒绝未知 node、未知 arm、重复 cue 和空中文讲解。六场 cue 固定绑定各自强协作、业务异常和完成节点；默认镜头插值 450ms。

- [ ] **Step 3: 连接 CameraDirector 与 PiP**

`DemoWorkspace` 只通过 runtime subscription 调用 director；同一 transitionKey 不重复切镜头。关闭自动讲解时任务继续，但不切镜头、不显示叙述。切场景/reset 立即总览并关闭 PiP。PiP 只在 cue 声明 `wristPipArmId` 时显示且与 focus arm 一致。

- [ ] **Step 4: 运行测试并提交**

Run: `npm run test:unit -- src/ui/presentation src/simulation/cameraDirector.test.ts`
Expected: 六场 cue 校验、事件去重、450ms 插值、关闭讲解、reset、PiP 一致性全部 PASS。

~~~bash
git add src/runtime src/simulation/cameraDirector* src/ui/presentation src/app/DemoWorkspace.tsx src/scenarios
git commit -m "feat(presentation): synchronize narration and camera cues"
~~~

### Task 2: 投资人控制台主题与兼容 fallback

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/DemoWorkspace.tsx`
- Modify: `src/ui/ScenarioGallery.tsx`
- Modify: `src/ui/SceneViewport.tsx`
- Modify: `src/ui/MissionPanel.tsx`
- Modify: `src/ui/ArmSwimlanes.tsx`
- Modify: `src/ui/PlaybackControls.tsx`
- Modify: `src/ui/ResultSummary.tsx`
- Create: `src/ui/InvestorDisclosure.tsx`
- Create: `src/ui/InvestorDisclosure.test.tsx`
- Create: `src/ui/LoadingProgress.tsx`
- Create: `src/ui/LoadingProgress.test.tsx`
- Create: `src/ui/CapabilityFallback.tsx`
- Create: `src/ui/CapabilityFallback.test.tsx`
- Create: `src/ui/theme/tokens.css`
- Create: `src/ui/theme/investorConsole.css`

**Interfaces:**
- Consumes: 现有运行时快照、加载进度和 capability error。
- Produces: 1920×1080 UI、`CapabilityFallback`、常驻披露信息。

- [ ] **Step 1: 写失败的披露和小屏 gate 测试**

~~~tsx
it("shows investor boundaries and avoids WebGL below 960px", () => {
  setViewportWidth(800);
  const createContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
  render(<App />);
  expect(screen.getByText(/模型物料/)).toBeVisible();
  expect(screen.getByText(/桌面 Chrome/)).toBeVisible();
  expect(createContext).not.toHaveBeenCalled();
});
~~~

Run: `npm run test:unit -- src/ui/InvestorDisclosure.test.tsx src/ui/CapabilityFallback.test.tsx`
Expected: FAIL，组件尚不存在。

- [ ] **Step 2: 实现固定设计 token 与布局**

定义背景、面板、文字、Arm 1–4 角色色、success/wait/error token；Franka 本体保持统一工业材质。1920×1080 下 workspace grid 使用 `minmax(0,72fr) minmax(320px,28fr)`，页面无整体滚动，任务面板内部滚动；顶部控制和底部泳道不被裁剪。

- [ ] **Step 3: 实现具体失败和加载状态**

模型、WebGL、WASM 失败分别显示原因、失败资产、重试和 Chrome 建议，不创建半加载 workspace。加载进度显示 scene XML/mesh/WASM 阶段。所有控制按钮保持固定 test id；`current-node` 暴露 `data-node-id`。

- [ ] **Step 4: 验证并提交**

Run: `npm run test:unit -- src/ui`
Expected: 披露、Demo 05 空盒标签、小屏 gate、红色语义、控制 test id、加载/三类错误和 72/28 DOM 布局测试全部 PASS。

~~~bash
git add src/app src/ui
git commit -m "feat(ui): polish the investor presentation console"
~~~

### Task 3: 场景懒加载与资源生命周期

**Files:**
- Create: `src/simulation/resourceLifecycle.ts`
- Create: `src/simulation/resourceLifecycle.test.ts`
- Modify: `src/ui/SceneViewport.tsx`
- Modify: `src/app/DemoWorkspace.tsx`
- Modify: `src/scenarios/registry.ts`

**Interfaces:**
- Consumes: Three disposable、MuJoCo model/data、object URL、subscription、RAF。
- Produces: `ScenarioResourceScope.track/dispose`、`SharedResourceCache.acquire/release`。

- [ ] **Step 1: 写失败的取消加载和完整释放测试**

~~~ts
it("releases all non-shared resources after a cancelled switch", async () => {
  const scope = new ScenarioResourceScope("demo04");
  scope.trackGeometry(fakeGeometry);
  scope.trackSubscription(unsubscribe);
  scope.trackAnimationFrame(rafId);
  await scope.dispose();
  expect(fakeGeometry.dispose).toHaveBeenCalledOnce();
  expect(unsubscribe).toHaveBeenCalledOnce();
  expect(cancelAnimationFrame).toHaveBeenCalledWith(rafId);
  expect(scope.counts()).toEqual({ disposable: 0, subscription: 0, raf: 0, objectUrl: 0 });
});
~~~

Run: `npm run test:unit -- src/simulation/resourceLifecycle.test.ts`
Expected: FAIL，resource scope 尚不存在。

- [ ] **Step 2: 实现 scope、引用计数与切换顺序**

每场景 scope 登记 geometry/material/texture、MuJoCo model/data、object URL、subscription 和 RAF。共享 Franka mesh 使用引用计数缓存；切换时先 AbortController 取消旧 load，再 detach runtime，最后 dispose scope；取消的 load 不得提交部分模块。

- [ ] **Step 3: 验证构建分包和释放**

Run: `npm run test:unit -- src/simulation/resourceLifecycle.test.ts src/scenarios/registry.test.ts && npm run build`
Expected: 六场景独立动态 chunk；首页初始请求不含未进入场景资产；卸载后非共享计数归零。

- [ ] **Step 4: 提交**

~~~bash
git add src/simulation/resourceLifecycle* src/ui/SceneViewport.tsx src/app/DemoWorkspace.tsx src/scenarios/registry.ts
git commit -m "perf: bound scenario resource lifecycles"
~~~

### Task 4: 许可证、来源与资产哈希审计

**Files:**
- Create: `LICENSES/THIRD_PARTY_NOTICES.md`
- Create: `LICENSES/source-inventory.json`
- Create: `LICENSES/asset-manifest.json`
- Create: `LICENSES/mujoco-react-Apache-2.0.txt`
- Modify: `LICENSES/franka-emika-panda-Apache-2.0.txt`
- Create: `LICENSES/aloha-BSD-3-Clause.txt`
- Create: `scripts/audit-licenses.mjs`
- Create: `scripts/copy-licenses.mjs`
- Create: `tests/licenses/licenseAudit.test.ts`
- Modify: `package.json`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: npm lock、发布资产、固定上游 commit 与许可证。
- Produces: `npm run licenses:check`、`dist/LICENSES/*`、页面许可入口。

- [ ] **Step 1: 写失败的来源缺失测试**

~~~ts
it("rejects a shipped asset without source, license and sha256", async () => {
  const report = await auditAssetManifest({
    files: [{ path: "models/franka/panda.xml", source: "", license: "", sha256: "" }]
  });
  expect(report.ok).toBe(false);
  expect(report.issues).toEqual(expect.arrayContaining([
    expect.stringMatching(/source/), expect.stringMatching(/license/), expect.stringMatching(/sha256/)
  ]));
});
~~~

Run: `npm run test:unit -- tests/licenses/licenseAudit.test.ts`
Expected: FAIL，审计器尚不存在。

- [ ] **Step 2: 固化来源清单**

清单记录：`mujoco-react 8.2.1 / dfdd719 / Apache-2.0 / runtime`；`Franka Menagerie b846dd1 / Apache-2.0 / copied assets`；`ALOHA / BSD-3-Clause / copiedFiles=[]`；`mujoco-react-example / no standalone LICENSE / referenceOnly=true / copiedFiles=[]`。

- [ ] **Step 3: 实现 SHA-256 与 dist 复制审计**

每个发布模型、纹理、字体、图标记录 path/source/upstreamCommit/license/modified/sha256。缺字段、哈希不符、未知/未许可 npm 依赖或参考仓 copiedFiles 非空时非零退出；build 后把整个 LICENSES 复制进 dist。

- [ ] **Step 4: 验证并提交**

Run: `npm run licenses:check && npm run test:unit -- tests/licenses/licenseAudit.test.ts && npm run build`
Expected: 零缺口；`dist/LICENSES` 包含清单、声明和全文；首页与工位可进入声明页。

~~~bash
git add LICENSES scripts/audit-licenses.mjs scripts/copy-licenses.mjs tests/licenses package.json package-lock.json src/app/App.tsx
git commit -m "build(licenses): ship auditable third-party notices"
~~~

### Task 5: 同一 dist 的根路径、子路径和断网部署

**Files:**
- Modify: `vite.config.ts`
- Create: `src/app/hashRoute.ts`
- Create: `src/app/hashRoute.test.ts`
- Create: `src/app/assetUrl.ts`
- Create: `src/app/assetUrl.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/scenarios/registry.ts`
- Create: `scripts/static-server.mjs`
- Create: `scripts/audit-dist.mjs`
- Create: `docs/deployment.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `document.baseURI`、场景 ID。
- Produces: `parseHashRoute`、`formatHashRoute`、`resolveStaticAsset`、`npm run dist:audit`、本地静态服务。

- [ ] **Step 1: 写失败的 baseURI 和深链测试**

~~~ts
it("resolves assets under the current mount without root absolutes", () => {
  expect(resolveStaticAsset("models/franka/panda.xml", "https://host/investor-demo/index.html"))
    .toBe("https://host/investor-demo/models/franka/panda.xml");
  expect(parseHashRoute("#/scenario/demo06")).toEqual({ page: "scenario", id: "demo06" });
});
~~~

Run: `npm run test:unit -- src/app/hashRoute.test.ts src/app/assetUrl.test.ts`
Expected: FAIL，路由/URL helper 尚不存在。

- [ ] **Step 2: 实现相对 base 与 hash route**

Vite `base="./"`；路由仅使用 `#/`、`#/scenario/demo01` 至 demo06、`#/licenses`。所有资源经 `resolveStaticAsset(relativePath, document.baseURI)`；源码禁止硬编码 `/models/`、CDN、远程字体和远程图标。

- [ ] **Step 3: 实现可验证静态服务与 dist audit**

`static-server.mjs` 接受 `--root --mount --port`，`.wasm` 返回 `application/wasm`，挂载外路径 404。`audit-dist.mjs` 解包扫描 HTML/JS/CSS/XML，拒绝绝对根资源、http(s) 外链和缺失许可；不要求 COOP/COEP。

- [ ] **Step 4: 写部署文档并验证同一构建**

Run: `npm run build && npm run dist:audit`，随后同一 `dist` 分别在 `/` 和 `/investor-demo/` 启动测试服务。
Expected: 六个 hash 深链直接打开/刷新均 200，WASM MIME 正确，阻断非本地 origin 后外部请求数 0；`file://` 明确不支持。

- [ ] **Step 5: 提交**

~~~bash
git add vite.config.ts src/app scripts/static-server.mjs scripts/audit-dist.mjs docs/deployment.md package*.json
git commit -m "build: support offline root and subpath deployment"
~~~

### Task 6: Playwright 功能、故障、部署与视觉回归

**Files:**
- Modify: `playwright.config.ts`
- Create: `playwright.deploy.config.ts`
- Create: `playwright.visual.config.ts`
- Create: `tests/e2e/fixtures/demoFixture.ts`
- Modify: `tests/e2e/helpers/demoPage.ts`
- Create: `tests/e2e/errors.spec.ts`
- Create: `tests/e2e/static-deploy.spec.ts`
- Create: `tests/e2e/offline.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Create: `tests/e2e/__screenshots__/chromium-1920x1080/*`
- Modify: `package.json`

**Interfaces:**
- Consumes: 公开 UI 和 test id；不能直接调用 `TaskRuntime`。
- Produces: `DemoPage`、功能/错误/离线/视觉报告。

- [ ] **Step 1: 写失败的六场参数化用户旅程**

~~~ts
for (const id of ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const) {
  test("Demo " + id.slice(-2) + " completes its visible fault", async ({ demo }) => {
    await demo.openScenario(id);
    await demo.expectReady();
    await demo.startAt2x();
    await demo.waitForVisibleBusinessFault();
    await demo.waitForSuccess();
    await demo.expectOracleResult();
    await demo.expectNoInfrastructureFault();
  });
}
~~~

Run: `npm run test:e2e -- tests/e2e/scenarios.spec.ts`
Expected: FAIL，统一 fixture/方法尚不完整。

- [ ] **Step 2: 完成 UI-only DemoPage 和故障注入**

DemoPage 只点击 UI/读取 DOM。模型/WASM 失败由 route abort 触发，WebGL 失败由 init script 覆盖 canvas context；断言具体原因、重试和不进入半加载。每个测试收集 pageerror、unhandled rejection 和 console error，非预期值使测试失败。

- [ ] **Step 3: 建立 25 张视觉基线**

固定 Chromium、1920×1080、deviceScaleFactor 1、中文、深色、相机 settled：首页 1 张，每场 READY/强协作/业务异常/完成各 1 张。`toHaveScreenshot` 使用 `threshold=0.2`、`maxDiffPixelRatio=0.01`。

- [ ] **Step 4: 验证功能、部署、离线和视觉**

Run: `npm run build && npm run test:e2e && npm run test:deploy && npm run test:e2e:visual`
Expected: 六场控制/复位/切换、三类故障、根/子路径、零外部请求和 25 张视觉对比全部通过。

- [ ] **Step 5: 提交**

~~~bash
git add playwright*.ts tests/e2e package*.json
git commit -m "test(e2e): cover the six-scene investor journey"
git commit -m "test(visual): lock investor-demo visual checkpoints"
~~~

### Task 7: 目标机性能、三轮循环和最终回归证据

**Files:**
- Create: `scripts/capture-benchmark-env.mjs`
- Create: `scripts/run-regression.mjs`
- Create: `playwright.performance.config.ts`
- Create: `tests/e2e/helpers/performanceProbe.ts`
- Create: `tests/e2e/performance.spec.ts`
- Create: `tests/e2e/continuous-loop.spec.ts`
- Create: `project/benchmark_env.md`
- Create: `project/requirements_traceability.md`
- Create: `project/final_verification.md`
- Modify: `package.json`
- Modify: `project/task_plan.md`
- Modify: `project/decision_log.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`
- Modify: `project/artifacts.md`
- Modify: `project/artifacts.jsonl`

**Interfaces:**
- Consumes: Performance API、CDP heap metrics、全部 npm 验证脚本。
- Produces: `performance-report.json`、环境记录、需求追踪矩阵和最终验证报告。

- [ ] **Step 1: 写失败的性能统计单测**

~~~ts
it("computes median and fifth percentile from ordered frame durations", () => {
  const fps = summarizeFrameTimes([16, 16, 17, 20, 25]);
  expect(fps.median).toBeCloseTo(58.82, 1);
  expect(fps.p05).toBe(40);
});
~~~

Run: `npm run test:unit -- tests/e2e/helpers/performanceProbe.test.ts`
Expected: FAIL，统计 helper 尚不存在。

- [ ] **Step 2: 捕获实际环境并拒绝软件渲染**

`capture-benchmark-env.mjs` 写 CPU、GPU/WebGL renderer、内存、OS、Chrome、1920×1080、git SHA 和日期。性能配置单 worker、无 retry；检测到 SwiftShader/llvmpipe/software renderer 立即失败。

- [ ] **Step 3: 实现硬门槛测试**

Demo 02、04、05 各运行 120 秒，统计 FPS median/p05；每场第二次 click-to-ready ≤2500ms。六场循环三轮，第一/三轮强制 CDP GC 后 `JSHeapUsedSize` 增量 ≤100 MiB；每轮结果表、对象计数、故障证据和最终节点一致，旧事件/统计残留为零。

- [ ] **Step 4: 建立需求追踪矩阵与回归编排**

`requirements_traceability.md` 每行映射需求/组件→单元→场景契约→E2E/性能，至少覆盖 TaskRuntime、ObjectCustody、SimulationStateBridge、Franka、多工具/镜头、播放控制、错误边界、静态资源和许可证。`run-regression.mjs` 依次执行 typecheck、unit、六契约、license、build、dist audit、functional E2E、deploy/offline、visual、performance/three-loop，遇首个非零立即退出。

- [ ] **Step 5: 运行完整验证**

Run: `npm ci && npm run test:regression`
Expected: 所有门通过；`test-results/performance/performance-report.json` 含 FPS、加载和 heap；六场业务异常各一次、InfrastructureFault 为零、所有禁臂反事实通过。

- [ ] **Step 6: 记录真实证据并提交**

只有上一步通过后，把命令、git SHA、测试数、Chrome/GPU、FPS、加载时间、heap 增长和报告路径写入 `project/final_verification.md`；更新任务、决策、standup、next actions 和 artifacts。

~~~bash
git add scripts playwright.performance.config.ts tests/e2e project package*.json
git commit -m "test: add full six-scene regression gate"
git commit -m "docs: record final verification and deployment evidence"
~~~
