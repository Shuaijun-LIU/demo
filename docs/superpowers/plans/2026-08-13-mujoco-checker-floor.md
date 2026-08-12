# MuJoCo Checker Floor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the global page header and render a shared muted-blue checker floor with white grid lines beneath all six static MuJoCo workcells.

**Architecture:** `App` owns only navigation and scene-stage layout. A focused `MujocoCheckerFloor` component owns a deterministic 2×2 `DataTexture`, its repeated render-only plane, and the white grid overlay; MJCF keeps the hidden collision plane.

**Tech Stack:** React 19, React Three Fiber, Three.js 0.181, Vitest, Testing Library, Playwright, MuJoCo WASM.

## Global Constraints

- Remove all three global header strings from the DOM.
- Keep the six scene buttons, scene metadata, orbit controls, and paused MuJoCo behavior.
- Use two muted blues plus thin white lines; do not introduce neon, emission, or a dark environment.
- Do not modify MJCF collision geometry or the 0.1 mm penetration threshold.

---

### Task 1: Header-free application shell

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/ui/theme/base.css`

**Interfaces:**
- Consumes: `VISUAL_SCENARIOS` and existing `SceneViewport`.
- Produces: an application DOM whose first application section is `nav.scene-selector`.

- [x] **Step 1: Write the failing test** asserting the three global header strings are absent and the scene selector is the shell's first child while six scene buttons remain.
- [x] **Step 2: Run `npm run test:unit -- src/app/App.test.tsx`** and verify failure because the current header remains.
- [x] **Step 3: Delete the header JSX and its unused CSS; change stage viewport-height allowance from 222 px to 144 px.**
- [x] **Step 4: Re-run the focused test** and verify it passes.

### Task 2: Shared render-only checker floor

**Files:**
- Create: `src/app/MujocoCheckerFloor.tsx`
- Create: `src/app/MujocoCheckerFloor.test.ts`
- Modify: `src/app/SceneViewport.tsx`

**Interfaces:**
- Produces: `createMujocoCheckerTexture(): DataTexture` and `MujocoCheckerFloor(): JSX.Element`.
- Consumes: Three.js `DataTexture`, `RepeatWrapping`, `NearestFilter`, `SRGBColorSpace`, and React Three Fiber mesh primitives.

- [x] **Step 1: Write the failing viewport contract test** for `blue-checker-white-grid`, then write the texture test expecting literal RGBA pixels `[91,130,166,255]`, `[136,169,198,255]`, `[136,169,198,255]`, `[91,130,166,255]` and repeat wrapping.
- [x] **Step 2: Run both focused RED tests** and verify the viewport attribute and texture factory are absent.
- [x] **Step 3: Implement the 2×2 texture with 14 tile repeats (28 squares), 7 m plane, and a 28-division white `gridHelper`; replace the grey helper in `SceneViewport`.**
- [x] **Step 4: Re-run the focused and viewport tests** and verify they pass.

### Task 3: Browser and physics verification

**Files:**
- Modify: `tests/e2e/static-showroom.spec.ts`
- Create: `project/checkpoints/2026-08-13-mujoco-checker-floor/*.png`
- Modify: `project/task_plan.md`
- Modify: `project/decision_log.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`

**Interfaces:**
- Consumes: the six `?scene=demo01..06` public routes.
- Produces: six browser screenshots, one contact sheet, and updated project tracking.

- [x] **Step 1: Change E2E assertions** to require absence of the three header strings and presence of the checker-floor contract.
- [x] **Step 2: Run `npm run test:all`, `npm run test:scenes`, `npm run test:static-scenes`, and `npm run build`.**
- [x] **Step 3: Run all six Playwright cases** and inspect the generated screenshots at original resolution.
- [ ] **Step 4: Update project records, commit intentionally, push the confirmed personal SSH remote, and verify the Pages Actions run.**
