# Line2 Six-Scene Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Line1 and add a default, shareable Line2 containing six low-saturation Franka workcells whose assets and layouts directly support each scene's continuous collaboration task.

**Architecture:** Keep the existing Line1 catalog and MJCF paths immutable. Add a version-aware app state, a separate Line2 catalog, a canonical asset registry, six independent Line2 MJCF files, and a scene-aware GLB layer rendered inside the existing MuJoCo canvas. Tests treat catalogs and MJCF as contracts; browser verification checks all twelve line/scene combinations and production Pages paths.

**Tech Stack:** React 19, TypeScript 5.8, React Three Fiber 9, Drei 10, Three 0.181, mujoco-react 8.2.1, MuJoCo WASM, Vitest, Testing Library, Playwright, Vite 6.

## Global Constraints

- Line1 files under `public/scenarios/demo01..06` and its catalog entries remain unchanged.
- Default URL state is `?line=line2&scene=demo01`; valid direct links preserve both parameters.
- Demo 01/03/06 use three Franka Panda arms; Demo 02/04/05 use four.
- Line2 uses the exact low-saturation tokens from `2026-08-12-line2-line3-evolution-design.md`; no large emissive materials or neon cyan environment light.
- Every Line2 catalog contains a collaboration primitive, a scripted business fault, recovery text, terminal oracle summary, tools, and real-asset bindings.
- Public Line2 assets total at most 45 MB; each file at most 15 MB; a scene's unique first-load assets target at most 12 MB.
- Selected RoboTwin2 files are copied from the shared read-only cache and documented as MIT-licensed derivatives/copies.
- The app stays backend-free and deployable at the Vite base `/demo/` on GitHub Pages.

---

### Task 1: Versioned catalog and URL state

**Files:**
- Create: `src/scenarios/line2Catalog.ts`
- Create: `src/app/urlState.ts`
- Create: `src/app/urlState.test.ts`
- Modify: `src/scenarios/visualCatalog.ts`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces: `LineId`, `ScenarioId`, `readDemoLocation(search)`, `writeDemoLocation(state)`, `getScenario(lineId, sceneId)`, `getScenarios(lineId)`.
- `Line2Scenario` extends the visible catalog shape with `collaboration`, `fault`, `recovery`, `oracle`, `tools`, `assets`, and `taskStages`.

- [ ] **Step 1: Write failing URL and catalog tests**

```ts
expect(readDemoLocation("")).toEqual({ lineId: "line2", sceneId: "demo01" });
expect(readDemoLocation("?line=line1&scene=demo06")).toEqual({ lineId: "line1", sceneId: "demo06" });
expect(writeDemoLocation({ lineId: "line2", sceneId: "demo05" })).toBe("?line=line2&scene=demo05");
expect(getScenario("line2", "demo05").armCount).toBe(4);
expect(getScenarios("line2")).toHaveLength(6);
```

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/app/urlState.test.ts src/app/App.test.tsx`
Expected: FAIL because `urlState.ts`, Line2 catalog, and version controls do not exist.

- [ ] **Step 3: Implement strict parsing, Line2 data, and selector**

```ts
export type LineId = "line1" | "line2";
export const SCENE_IDS = ["demo01", "demo02", "demo03", "demo04", "demo05", "demo06"] as const;

export function readDemoLocation(search: string): DemoLocation {
  const params = new URLSearchParams(search);
  return {
    lineId: params.get("line") === "line1" ? "line1" : "line2",
    sceneId: isSceneId(params.get("scene")) ? params.get("scene") : "demo01",
  } as DemoLocation;
}
```

Add Line2 task stages exactly matching the approved spec; update the browser URL with `history.replaceState` on user selection and subscribe to `popstate`.

- [ ] **Step 4: Run GREEN verification**

Run: `npm run test:unit -- src/app/urlState.test.ts src/app/App.test.tsx`
Expected: PASS; default Line2, direct links, six scene buttons, and Demo05 four-arm assertions succeed.

- [ ] **Step 5: Commit**

```bash
git add src/app src/scenarios
git commit -m "feat(app): add Line2 navigation and task catalog"
```

### Task 2: Low-saturation Line2 presentation

**Files:**
- Create: `src/app/LineSelector.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/ui/theme/base.css`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `<LineSelector activeLine onSelect />` and root `data-line` theme switch.
- Consumes: `LineId` and version-aware catalog from Task 1.

- [ ] **Step 1: Write failing presentation tests**

```ts
expect(screen.getByRole("button", { name: /Line 2/ })).toHaveAttribute("aria-pressed", "true");
expect(screen.getByRole("main")).toHaveAttribute("data-line", "line2");
fireEvent.click(screen.getByRole("button", { name: /Line 1/ }));
expect(screen.getByRole("main")).toHaveAttribute("data-line", "line1");
```

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/app/App.test.tsx`
Expected: FAIL because the line selector and `data-line` attribute are absent.

- [ ] **Step 3: Implement selector and scoped tokens**

Declare all `--l2-*` tokens from the approved spec under `[data-line="line2"]`; replace Line2 stage lighting, borders, chips, selected tabs, state dots, viewport background, and arm role classes with muted values. Keep current Line1 values under `[data-line="line1"]` or existing defaults.

- [ ] **Step 4: Run GREEN verification and build**

Run: `npm run test:unit -- src/app/App.test.tsx && npm run typecheck`
Expected: PASS with Line2 default and reversible Line1 styling.

- [ ] **Step 5: Commit**

```bash
git add src/app src/ui/theme/base.css
git commit -m "feat(ui): add restrained Line2 visual system"
```

### Task 3: Asset registry and licensed public asset set

**Files:**
- Create: `src/scenarios/assetRegistry.ts`
- Create: `src/scenarios/assetRegistry.test.ts`
- Create: `public/assets/line2/ASSET_PROVENANCE.md`
- Create: `public/licenses/robotwin2-assets-MIT.txt`
- Add: `public/assets/line2/box.glb`
- Add: `public/assets/line2/battery.glb`
- Add: `public/assets/line2/tray.glb`
- Add: `public/assets/line2/scanner.glb`
- Add: `public/assets/line2/electronic-scale.glb`
- Add: `public/assets/line2/screwdriver.glb`
- Add: `public/assets/line2/pill-bottle.glb`
- Add: `public/assets/line2/apple.glb`

**Interfaces:**
- Produces: `ASSET_REGISTRY`, `getAssetDefinition(id)`, `getSceneAssetInstances(sceneId)`.
- `AssetInstance` contains `id`, `assetId`, `position`, `rotation`, `scale`, `role`, and `objectId`.

- [ ] **Step 1: Write failing registry tests**

```ts
expect(Object.keys(ASSET_REGISTRY)).toEqual(expect.arrayContaining(["battery", "pill-bottle", "apple"]));
expect(getSceneAssetInstances("demo05").every((item) => item.objectId.length > 0)).toBe(true);
expect(getSceneAssetInstances("demo06").some((item) => item.assetId === "apple")).toBe(true);
```

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/scenarios/assetRegistry.test.ts`
Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Copy selected assets and write provenance**

Use the smallest recognizable RoboTwin2 variants: collision GLBs for battery/tray/scanner/scale/pill bottle, visual GLBs for apple/screwdriver, and the 13 KB box. Preserve filenames' source paths and SHA-256 hashes in provenance. Copy the MIT text verbatim from the local RoboTwin license source.

- [ ] **Step 4: Implement registry and enforce budget**

```ts
export interface AssetDefinition {
  readonly id: AssetId;
  readonly uri: string;
  readonly source: "RoboTwin2" | "project";
  readonly license: "MIT" | "Project";
  readonly bytes: number;
}
```

The test reads declared byte counts and asserts total≤45 MB and each≤15 MB. Scene instances use canonical task object IDs.

- [ ] **Step 5: Run GREEN verification and file audit**

Run: `npm run test:unit -- src/scenarios/assetRegistry.test.ts && find public/assets/line2 -type f -printf '%f %s\n' | sort`
Expected: PASS and total public asset size within budget.

- [ ] **Step 6: Commit**

```bash
git add src/scenarios public/assets/line2 public/licenses
git commit -m "feat(assets): add licensed Line2 object library"
```

### Task 4: Six independent Line2 MJCF workcells

**Files:**
- Create: `src/scenarios/line2SceneFiles.test.ts`
- Create: `public/scenarios/line2/demo01/scene.xml`
- Create: `public/scenarios/line2/demo02/scene.xml`
- Create: `public/scenarios/line2/demo03/scene.xml`
- Create: `public/scenarios/line2/demo04/scene.xml`
- Create: `public/scenarios/line2/demo05/scene.xml`
- Create: `public/scenarios/line2/demo06/scene.xml`
- Modify: `src/app/SceneViewport.tsx`

**Interfaces:**
- Produces: `getSceneFile(lineId, sceneId)` returning `scenarios/<id>/scene.xml` for Line1 and `scenarios/line2/<id>/scene.xml` for Line2.
- Every Line2 MJCF names work zones, task objects, tool docks, destinations, pedestals, and all arm prefixes.

- [ ] **Step 1: Write failing MJCF contract tests**

```ts
expect(getSceneFile("line2", "demo05")).toBe("scenarios/line2/demo05/scene.xml");
expect(xml.match(/<attach model="panda"/g)).toHaveLength(expectedArmCount);
expect(xml).not.toMatch(/emission="(?:0\.[1-9]|[1-9])/);
expect(xml).toContain(requiredZoneName);
```

Required zone names are `handoff_pad/test_fixture`, `clip_c2/tool_dock`, `carton_fixture/scale`, `assembly_fixture/tool_dock`, `rx_merge/packaging_gate`, and `pitter/rework`.

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/scenarios/line2SceneFiles.test.ts`
Expected: FAIL because Line2 paths and files do not exist.

- [ ] **Step 3: Build the six MJCFs**

Use neutral materials, correct Z-up bases, readable task geometry, and the exact arm roles from the spec. Demo05 includes four `<attach>` elements. Keep collision disabled for deterministic visual review but name every future task body and zone.

- [ ] **Step 4: Run GREEN verification and compile in browser**

Run: `npm run test:unit -- src/scenarios/line2SceneFiles.test.ts && npm run typecheck`
Expected: PASS for six paths, arm counts, required zones, and palette constraints.

- [ ] **Step 5: Commit**

```bash
git add src/app/SceneViewport.tsx src/scenarios/line2SceneFiles.test.ts public/scenarios/line2
git commit -m "feat(scenes): add six Line2 Franka workcells"
```

### Task 5: Scene-aware realistic GLB layer

**Files:**
- Create: `src/app/RealisticAssetLayer.tsx`
- Create: `src/app/RealisticAssetLayer.test.tsx`
- Modify: `src/app/SceneViewport.tsx`

**Interfaces:**
- Produces: `<RealisticAssetLayer sceneId visible />`.
- Consumes: `getSceneAssetInstances(sceneId)` and public GLBs from Task 3.

- [ ] **Step 1: Write failing layer tests**

```ts
render(<RealisticAssetLayer sceneId="demo05" visible />);
expect(screen.getByTestId("asset-layer")).toHaveAttribute("data-scene-assets", "pill-bottle,box,scanner,tray");
```

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/app/RealisticAssetLayer.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement lazy GLB clones and fallback**

Use Drei `useGLTF` per registry URI, clone the loaded scene before applying transform, set `castShadow/receiveShadow`, and place it under a scene-level `<group>`. Wrap the layer in `Suspense`; on asset error retain the MJCF proxy and surface a non-blocking asset status rather than removing the canonical object.

- [ ] **Step 4: Run GREEN verification and build**

Run: `npm run test:unit -- src/app/RealisticAssetLayer.test.tsx && npm run build`
Expected: PASS and Vite copies all GLBs under `/demo/assets/line2/`.

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "feat(rendering): add Line2 realistic asset layer"
```

### Task 6: Task-ready UI evidence and stage preview

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/SceneViewport.tsx`
- Modify: `src/ui/theme/base.css`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Produces: visible collaboration/fault/recovery/oracle cards and stage indicator derived from `taskStages`.
- Motion preview advances through deterministic stages and drives purposeful arm motion profiles rather than unrelated free oscillation.

- [ ] **Step 1: Write failing task-evidence tests**

```ts
expect(screen.getByText(/正式交接/)).toBeVisible();
expect(screen.getByText(/P3.*背面标记/)).toBeVisible();
expect(screen.getByText(/P1→A1/)).toBeVisible();
fireEvent.click(screen.getByRole("button", { name: "播放任务路径" }));
expect(screen.getByTestId("active-stage")).toHaveTextContent("上料与扫码");
```

- [ ] **Step 2: Run RED verification**

Run: `npm run test:unit -- src/app/App.test.tsx`
Expected: FAIL because task evidence and stage preview are absent.

- [ ] **Step 3: Implement deterministic stage preview**

Use elapsed simulation time modulo scene stage durations to set the visible active stage and choose per-arm joint target envelopes. Preserve pause/reset semantics. Label this release “场景与任务路径预览”; do not claim full object physics or completed TaskRuntime.

- [ ] **Step 4: Run GREEN verification**

Run: `npm run test:unit -- src/app/App.test.tsx && npm run typecheck`
Expected: PASS for all six task evidence records and preview controls.

- [ ] **Step 5: Commit**

```bash
git add src/app src/ui/theme/base.css
git commit -m "feat(demo): expose Line2 collaboration task paths"
```

### Task 7: Browser, screenshots, Pages, and records

**Files:**
- Create: `tests/e2e/line2-scenes.spec.ts`
- Create: `project/checkpoints/2026-08-12-line2-scenes/README.md`
- Add: `project/checkpoints/2026-08-12-line2-scenes/demo01.png` through `demo06.png`
- Create: `project/checkpoints/2026-08-12-line2-scenes/demo05-four-arm.png`
- Modify: `project/task_plan.md`
- Modify: `project/decision_log.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`
- Modify: `project/artifacts.jsonl`
- Modify: `project/artifacts.md`

**Interfaces:**
- Produces: browser evidence for six Line2 scenes, deployment URL, and project handoff.

- [ ] **Step 1: Write failing browser matrix**

```ts
for (const scene of scenes) {
  await page.goto(`/demo/?line=line2&scene=${scene.id}`);
  await expect(page.getByTestId("scene-viewport")).toHaveAttribute("data-line-id", "line2");
  await expect(page.getByText(scene.heading)).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
}
```

- [ ] **Step 2: Run RED verification, then implement only missing browser hooks**

Run: `npm run test:e2e -- tests/e2e/line2-scenes.spec.ts`
Expected first run: FAIL if server configuration or test IDs are missing; add only the required hooks/configuration.

- [ ] **Step 3: Capture evidence**

Run the production preview, visit each direct link, wait for `N × Panda 与 Line2 工位已加载`, and save 1600×1000 screenshots. Check console errors and HTTP responses for asset 404s.

- [ ] **Step 4: Full verification**

Run: `npm run test:all && npm run build && npm run test:e2e -- tests/e2e/line2-scenes.spec.ts && git diff --check`
Expected: all commands exit 0; six Line2 workcells and Line1 fallback are covered.

- [ ] **Step 5: Commit and push through the approved SSH remote**

```bash
git add tests project .github
git commit -m "test: verify Line2 scenes and deployment"
git push origin HEAD:main
```

Verify the public repository workflow and `https://shuaijun-liu.github.io/demo/?line=line2&scene=demo01`; retry only after reading the failing Actions job or HTTP response.
