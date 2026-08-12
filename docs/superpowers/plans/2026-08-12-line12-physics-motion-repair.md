# Line1/Line2 Physics and Motion Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair all twelve Line1/Line2 workcells so Panda bases are mounted at tabletop height, task assets have calibrated transforms, contacts are enabled, and playback visibly executes coordinated robot/object motion instead of a disconnected joint oscillation.

**Architecture:** Keep the approved deterministic browser-first architecture. A shared scene audit module defines physical invariants for all twelve MJCF files; a calibrated asset registry converts RoboTwin Y-up models into the application's Z-up coordinates; a deterministic motion catalog drives semantic multi-arm stages and binds carried objects to the corresponding MuJoCo hand body. MuJoCo remains the authoritative source for robot body poses and collision rendering.

**Tech Stack:** React 19, TypeScript, Three.js/R3F, mujoco-react 8.2.1, MuJoCo WASM, Vitest, Playwright.

## Global Constraints

- Preserve Line1 and Line2 URLs and static GitHub Pages deployment.
- Use Franka Panda for every scene.
- No backend, API key, LLM, or runtime network dependency.
- Do not resume or alter the rejected Line3 implementation.
- Playback must show continuous robot motion; a task object may move only while visibly carried by a robot or while being placed/released.
- Every scene must load with contact enabled and a Panda base mounting plane aligned to the work surface.
- RoboTwin GLBs must use source metadata scale, explicit Y-up to Z-up conversion, and bottom-center origin normalization.

---

### Task 1: Scene physical invariants

**Files:**
- Create: `src/scenarios/scenePhysics.ts`
- Create: `src/scenarios/scenePhysics.test.ts`
- Modify: `public/scenarios/demo01/scene.xml` through `demo06/scene.xml`
- Modify: `public/scenarios/line2/demo01/scene.xml` through `demo06/scene.xml`

**Interfaces:**
- Produces: `SCENE_PHYSICS`, `getScenePhysics(lineId, sceneId)`, and `auditSceneXml(xml, expectation)`.

- [ ] Write tests requiring gravity, contact, exact arm count, base/tabletop alignment within 1 mm, and named task bodies.
- [ ] Run the focused suite and observe failures against the current XML.
- [ ] Move every Panda frame to the scene mounting plane, add full-height support pedestals, enable contact and gravity, and wrap movable task objects in named bodies.
- [ ] Re-run focused tests and compile all twelve MJCF files with MuJoCo.

### Task 2: Calibrated RoboTwin assets

**Files:**
- Modify: `src/scenarios/assetRegistry.ts`
- Modify: `src/scenarios/assetRegistry.test.ts`
- Modify: `src/app/RealisticAssetLayer.tsx`
- Modify: `src/app/RealisticAssetLayer.test.ts`

**Interfaces:**
- Produces: asset source scale, up-axis correction, native bounds, bottom-center normalization, and optional MuJoCo body binding.

- [ ] Write tests that reject the current hand-authored oversized transforms and require metadata scale/up-axis/body binding.
- [ ] Run the focused suite and observe the expected failures.
- [ ] Apply RoboTwin scale metadata, rotate Y-up assets into Z-up, normalize each clone to its bottom center, and follow the canonical MuJoCo body pose.
- [ ] Hide corresponding primitive proxy geoms while retaining their collision bodies.
- [ ] Re-run focused tests and visually inspect all six Line2 scenes.

### Task 3: Semantic multi-arm motion

**Files:**
- Create: `src/scenarios/motionCatalog.ts`
- Create: `src/scenarios/motionCatalog.test.ts`
- Create: `src/app/ScenarioMotionController.tsx`
- Modify: `src/app/SceneViewport.tsx`

**Interfaces:**
- Produces: `getMotionProgram(lineId, sceneId)` with per-arm joint keyframes, semantic stage intervals, and object custody windows.

- [ ] Write tests requiring all arms to have non-static in-range trajectories and every carried object window to reference an active arm.
- [ ] Run the focused suite and observe failures because no semantic program exists.
- [ ] Generate collision-safe Panda keyframes, interpolate with smoothstep, write actuator controls per arm, and synchronize carried objects from MuJoCo hand poses.
- [ ] Replace `MotionPreview` and expose the active semantic stage from the same program used for motion.
- [ ] Re-run focused tests and capture idle/mid/final frames for all twelve scenes.

### Task 4: Visual and motion regression gate

**Files:**
- Modify: `tests/e2e/line2-scenes.spec.ts`
- Create: `tests/e2e/line12-motion.spec.ts`
- Create: `project/checkpoints/2026-08-12-line12-repair/README.md`

**Interfaces:**
- Consumes: scene physical audits, calibrated assets, and semantic motion programs.
- Produces: twelve-scene screenshots plus machine-checkable playback evidence.

- [ ] Add browser assertions for motion frame changes, stage progression, zero HTTP/console errors, and calibrated asset diagnostics.
- [ ] Run the browser tests against the unfixed behavior where applicable and retain the expected failure evidence.
- [ ] Run unit tests, typecheck, production build, MuJoCo compile audit, and Playwright regression.
- [ ] Record screenshots, measurements, remaining limitations, commit, and push the repair branch to the configured GitHub remote.
