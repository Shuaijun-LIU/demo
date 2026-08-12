# Static Showroom Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Line 1 / Line 2 motion console with one bright, minimal, static six-scene Franka Panda showroom with verified initial geometry.

**Architecture:** The React app owns only a `ScenarioId` and renders one compact scene selector plus `SceneViewport`. `SceneViewport` loads only `public/scenarios/demoXX/scene.xml`, keeps MuJoCo paused, and exposes orbit-camera interaction without any motion controller. Scene XML contains only fixed display geometry and attached Panda models; repository contract tests and a MuJoCo validation script enforce the static, single-version structure.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Three.js / React Three Fiber, `mujoco-react`, `mujoco-js`, Vitest, Testing Library, Playwright.

**Status:** Tasks 1–6 implemented and visually reviewed; Task 7 final verification and Pages deployment in progress.

## Global Constraints

- The product must not display or route between Line 1 and Line 2.
- Delete Line 2 product code, product assets, and Line 2 browser tests.
- Keep exactly six scene themes and their original `demo01` through `demo06` identifiers.
- MuJoCo must remain paused; no playback, pause, reset, timeline, task path, or motion lane UI may remain.
- Orbit rotation and wheel zoom remain available.
- UI and 3D environment use white, off-white, light grey, graphite, and small amounts of muted industrial accent color.
- Initial scenes must contain no duplicate dynamic payload, object/table penetration, robot/table penetration, or robot/robot penetration.
- Use test-first changes and commit each independently testable task.

## File Structure

- `src/app/App.tsx`: minimal page composition and active-scene selection only.
- `src/app/SceneViewport.tsx`: static MuJoCo renderer and orbit camera only.
- `src/app/urlState.ts`: `scene`-only URL parsing and serialization.
- `src/scenarios/visualCatalog.ts`: the six scene labels and short display descriptions.
- `src/scenarios/sceneFiles.ts`: map a `ScenarioId` directly to one XML file.
- `src/ui/theme/base.css`: complete bright showroom visual system.
- `src/app/App.test.tsx`, `src/app/urlState.test.ts`, `src/scenarios/scenePhysics.test.ts`: single-version, static-display, and XML invariants.
- `scripts/compile-scenes.mjs`: compile only six retained scenes.
- `scripts/validate-static-scenes.mjs`: load fixed Panda home poses and reject unexpected initial contacts.
- `tests/e2e/static-showroom.spec.ts`: six-scene browser and visual-smoke coverage.
- `public/scenarios/demo01/scene.xml` … `demo06/scene.xml`: fixed, neutral, non-overlapping workcells.

---

### Task 1: Single-version page and URL contract

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/urlState.test.ts`
- Modify: `src/app/urlState.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/scenarios/sceneFiles.ts`

**Interfaces:**
- Produces: `readDemoLocation(search: string): { sceneId: ScenarioId }`
- Produces: `writeDemoLocation(sceneId: ScenarioId): string`
- Produces: `getSceneFile(sceneId: ScenarioId): string`
- Consumes: `VISUAL_SCENARIOS` and `getVisualScenario(id)` from `visualCatalog.ts`.

- [ ] **Step 1: Replace the page tests with the desired static showroom contract**

```tsx
it("renders one minimal six-scene showroom", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "多机械臂场景展示" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /场景 0[1-6]/ })).toHaveLength(6);
  for (const forbidden of [/Line 1/i, /Line 2/i, /播放/, /暂停/, /复位/, /任务泳道/, /任务路径/]) {
    expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
  }
});
```

- [ ] **Step 2: Replace URL tests with scene-only behavior and verify RED**

```ts
expect(readDemoLocation("?line=line2&scene=demo06")).toEqual({ sceneId: "demo06" });
expect(writeDemoLocation("demo05")).toBe("?scene=demo05");
```

Run: `npm run test:unit -- src/app/App.test.tsx src/app/urlState.test.ts`  
Expected: FAIL because the current app still renders version and playback UI and writes `line`.

- [ ] **Step 3: Implement the minimal scene-only state and page shell**

`App` must contain only `activeScenarioId`, `selectScenario`, the top heading, six buttons, a scene title/arm-count overlay, and `SceneViewport`. Handle `popstate` by restoring only `sceneId`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test:unit -- src/app/App.test.tsx src/app/urlState.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/app/urlState.ts src/app/urlState.test.ts src/scenarios/sceneFiles.ts
git commit -m "refactor(web): collapse demo into one scene gallery"
```

### Task 2: Permanently static viewport

**Files:**
- Create: `src/app/SceneViewport.test.tsx`
- Modify: `src/app/SceneViewport.tsx`
- Delete: `src/app/ScenarioMotionController.tsx`
- Delete: `src/app/ScenarioMotionController.test.ts`
- Delete: `src/scenarios/motionCatalog.ts`
- Delete: `src/scenarios/motionCatalog.test.ts`
- Delete: `src/scenarios/graspCalibration.ts`
- Delete: `src/scenarios/graspCalibration.test.ts`

**Interfaces:**
- Produces: `SceneViewport({ sceneId, armCount }: { sceneId: ScenarioId; armCount: 3 | 4 })`.
- Consumes: `getSceneFile(sceneId)` from `sceneFiles.ts`.

- [ ] **Step 1: Add a source-contract test for a paused renderer**

```ts
const source = readFileSync(resolve("src/app/SceneViewport.tsx"), "utf8");
expect(source).toContain("paused");
expect(source).toContain("speed={0}");
expect(source).not.toContain("ScenarioMotionController");
expect(source).not.toContain("PreviewMode");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- src/app/SceneViewport.test.tsx`  
Expected: FAIL because motion state and the controller are still mounted.

- [ ] **Step 3: Reduce `SceneViewport` to fixed configuration**

Set `paused`, `speed={0}`, a light-grey background/fog, neutral-white lights, low-contrast grey grid, and retain `OrbitControls`. Remove line, mode, reset-token, asset-layer, status, and controller props.

- [ ] **Step 4: Delete motion-only modules and verify GREEN**

Run: `npm run test:unit -- src/app/SceneViewport.test.tsx && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src/app src/scenarios
git commit -m "refactor(web): make the showroom permanently static"
```

### Task 3: Remove Line 2 product surface and assets

**Files:**
- Create: `src/scenarios/singleVersion.contract.test.ts`
- Delete: `src/app/LineSelector.tsx`
- Delete: `src/app/Line2App.test.tsx`
- Delete: `src/app/Line2TaskEvidence.test.tsx`
- Delete: `src/app/RealisticAssetLayer.tsx`
- Delete: `src/app/RealisticAssetLayer.fixed.tsx`
- Delete: `src/app/RealisticAssetLayer.test.ts`
- Delete: `src/scenarios/line2Catalog.ts`
- Delete: `src/scenarios/line2Catalog.test.ts`
- Delete: `src/scenarios/line2SceneFiles.test.ts`
- Delete: `src/scenarios/assetRegistry.ts`
- Delete: `src/scenarios/assetRegistry.test.ts`
- Delete: `src/scenarios/assetRegistry.calibrated.ts`
- Delete: `src/scenarios/assetRegistry.calibrated.test.ts`
- Delete: `src/scenarios/assetCalibration.test.ts`
- Delete: `tests/e2e/line2-scenes.spec.ts`
- Delete: `tests/e2e/line12-repair.spec.ts`
- Delete: `public/scenarios/line2/`
- Delete: `public/assets/line2/`
- Delete: `public/licenses/robotwin2-assets-MIT.txt`

**Interfaces:**
- Produces: a repository where front-end source and product assets contain no Line 2 runtime path.

- [ ] **Step 1: Add a failing repository structure contract**

```ts
expect(existsSync("public/scenarios/line2")).toBe(false);
expect(existsSync("public/assets/line2")).toBe(false);
for (const file of productSources) expect(readFileSync(file, "utf8")).not.toMatch(/line2|Line 2/i);
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `npm run test:unit -- src/scenarios/singleVersion.contract.test.ts`  
Expected: FAIL because Line 2 directories and imports exist.

- [ ] **Step 3: Remove listed Line 2 code and assets**

Use explicit file paths, preserve historical Markdown and checkpoint images, and remove only product/runtime content listed above.

- [ ] **Step 4: Run unit tests and typecheck**

Run: `npm run test:unit && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(web): remove Line 2 product assets"
```

### Task 4: Neutralize and de-duplicate six MJCF scenes

**Files:**
- Modify: `src/scenarios/scenePhysics.test.ts`
- Modify: `public/scenarios/demo01/scene.xml`
- Modify: `public/scenarios/demo02/scene.xml`
- Modify: `public/scenarios/demo03/scene.xml`
- Modify: `public/scenarios/demo04/scene.xml`
- Modify: `public/scenarios/demo05/scene.xml`
- Modify: `public/scenarios/demo06/scene.xml`

**Interfaces:**
- Produces: six compilable fixed scenes with zero free joints and one visible instance of each payload.
- Produces: Panda base frame Z values matching each scene's work-surface Z: demo01 `0.675`, demo02 `0.675`, demo03 `0.675`, demo04 `0.58`, demo05 `0.675`, demo06 `0.665`.

- [ ] **Step 1: Rewrite scene invariant tests for static geometry**

```ts
expect(xml).not.toContain("<freejoint");
expect(xml).not.toContain('body name="task_payload"');
expect(xml).not.toMatch(/emission="(?!0(?:\.0+)?")[^"]+"/);
expect(xml).not.toMatch(/rgba="0\.0(?:1|2) /); // reject retained near-black floor palette
expect(baseFrames).toHaveLength(expectedArmCount);
```

- [ ] **Step 2: Run scene tests and verify RED**

Run: `npm run test:unit -- src/scenarios/scenePhysics.test.ts`  
Expected: FAIL for free joints, dynamic payloads, emissive accents, and dark materials.

- [ ] **Step 3: Apply one shared material direction to all six XML files**

Use neutral values equivalent to: floor `0.82 0.83 0.81`, steel `0.62 0.65 0.66`, work surface `0.76 0.77 0.75`, belt `0.22 0.24 0.25`, muted blue-grey `0.32 0.48 0.56`, muted mauve-grey `0.48 0.43 0.52`, ochre `0.68 0.53 0.28`, sage `0.36 0.55 0.42`, brick `0.65 0.32 0.3`; remove all material emission.

- [ ] **Step 4: Delete each `task_payload` body and keep its named fixed proxy**

Retain `p1`, `connector_a`, `carton_ok`, `spare_brace`, `tote`, and `fruit_payload_proxy` as the single visible payloads. Confirm each proxy bottom is above its supporting surface and does not share an identical solid volume with another geom.

- [ ] **Step 5: Run tests and compile all scenes**

Run: `npm run test:unit -- src/scenarios/scenePhysics.test.ts && npm run test:scenes`  
Expected: PASS and exactly six `demoXX` compile lines.

- [ ] **Step 6: Commit**

```bash
git add public/scenarios src/scenarios/scenePhysics.test.ts scripts/compile-scenes.mjs
git commit -m "fix(scenes): remove overlap and adopt neutral materials"
```

### Task 5: Bright minimal responsive presentation

**Files:**
- Modify: `src/ui/theme/base.css`
- Modify: `src/scenarios/visualCatalog.ts`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `.app-shell`, `.showroom-header`, `.scene-selector`, `.scene-button`, `.showroom-stage`, `.scene-meta`, `.viewport-help` emitted by `App.tsx`.
- Produces: responsive layout with no forced desktop minimum width.

- [ ] **Step 1: Add semantic UI assertions**

```tsx
expect(screen.getByText("静态场景 · 拖动旋转 · 滚轮缩放")).toBeVisible();
expect(screen.queryByText(/SCENE STATUS|OBJECT FLOW|CURRENT REVIEW/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the app test and verify RED**

Run: `npm run test:unit -- src/app/App.test.tsx`  
Expected: FAIL until the final compact copy and elements exist.

- [ ] **Step 3: Replace the old stylesheet**

Implement an off-white page, white stage, graphite text, subtle grey borders, restrained shadow, six compact tabs, 16:9-like viewport that fills available height, and responsive stacking below 860 px. Do not retain dark color scheme, radial neon gradients, glowing dots, chips, status cards, or line-specific selectors.

- [ ] **Step 4: Shorten catalog copy for display-only usage and verify GREEN**

Run: `npm run test:unit -- src/app/App.test.tsx && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/scenarios/visualCatalog.ts src/ui/theme/base.css
git commit -m "style(web): introduce bright minimal showroom"
```

### Task 6: Contact validation and browser evidence

**Files:**
- Create: `scripts/validate-static-scenes.mjs`
- Modify: `package.json`
- Create: `tests/e2e/static-showroom.spec.ts`
- Create: `project/checkpoints/2026-08-12-static-showroom/README.md`
- Create: six PNG screenshots and `static-showroom-contact-sheet.png` under that checkpoint.

**Interfaces:**
- Produces: `npm run test:static-scenes` with exit code 0 only when all retained scenes compile and have no unexpected initial robot/workcell or robot/robot penetration.

- [ ] **Step 1: Add the browser test and observe the old evidence contract fail**

```ts
for (const sceneId of scenes) {
  await page.goto(`?scene=${sceneId}`);
  await expect(page.getByTestId("scene-viewport").locator("canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: /播放|暂停|复位/ })).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(242, 242, 239)");
}
```

Run: `npx playwright test tests/e2e/static-showroom.spec.ts`  
Expected: FAIL before the checkpoint and final CSS contract are implemented.

- [ ] **Step 2: Implement the MuJoCo initial-contact validator**

Load all public assets into `mujoco-js`, apply `[0, -0.7, 0, -2.2, 0, 1.6, 0.78, 255]` to every Panda actuator block (seven arm joints plus the gripper tendon), call forward, and list contacts below the `-0.1 mm` tolerance. Exit non-zero with scene, geom names, and distances for any rejected contact.

- [ ] **Step 3: Add scripts and run complete geometry checks**

```json
"test:static-scenes": "node scripts/validate-static-scenes.mjs"
```

Run: `npm run test:scenes && npm run test:static-scenes`  
Expected: PASS for six scenes with zero rejected penetration contacts.

- [ ] **Step 4: Run Playwright, capture six 1440×900 screenshots, and create the contact sheet**

Run: `npx playwright test tests/e2e/static-showroom.spec.ts`  
Expected: PASS with no console or page errors.

- [ ] **Step 5: Inspect all six screenshots at original resolution**

Reject and correct any dark background, duplicated object, apparent intersection, clipped robot, unsuitable base height, excessive UI, or camera framing problem; rerun affected automated tests after every correction.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts tests/e2e project/checkpoints/2026-08-12-static-showroom
git commit -m "test(web): verify static showroom geometry and visuals"
```

### Task 7: Full verification, records, and Pages deployment

**Files:**
- Modify: `README.md`
- Modify: `project/decision_log.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`

**Interfaces:**
- Produces: deployment-ready `dist/` and a recorded final checkpoint.

- [ ] **Step 1: Update user-facing and local progress records**

Document that the browser product is a single static showroom, Line 2 product assets were removed, Line 3 is not exposed, and provide the final checkpoint paths. Do not include machine-local account routing or cluster commands.

- [ ] **Step 2: Run the complete verification suite**

Run: `npm run test:all && npm run test:scenes && npm run test:static-scenes && npm run build && npx playwright test tests/e2e/static-showroom.spec.ts`  
Expected: all commands exit 0 without application console errors.

- [ ] **Step 3: Check repository hygiene**

Run: `git diff --check && git status --short && rg -n 'line2|Line 2|播放|暂停|任务泳道' src public/scenarios tests/e2e README.md`  
Expected: no stale product references; only intentional historical references outside scanned product paths.

- [ ] **Step 4: Commit records**

```bash
git add README.md project
git commit -m "docs: record static showroom delivery"
```

- [ ] **Step 5: Push the verified work to the deployed main branch**

Run: `git push origin HEAD:main`  
Expected: remote `main` advances and the existing GitHub Pages Actions workflow starts.
