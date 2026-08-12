# Deeper Showroom Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the 3D viewport background and both blue checker tiles without changing the white UI, geometry, lighting, or physical floor.

**Architecture:** Keep the existing `SceneViewport` and `MujocoCheckerFloor` boundaries. Change only their literal palette values plus the matching CSS fallback, then verify all six routes through the existing browser suite.

**Tech Stack:** React 19, React Three Fiber, Three.js 0.181, Vitest, Playwright, MuJoCo WASM.

## Global Constraints

- Viewport background and fog must use `#d2d5d4`.
- Checker pixels must use `[69,108,142,255]` and `[113,147,174,255]` in alternating order.
- White grid lines, lighting, camera, UI colors, MJCF and collision validation must not change.

---

### Task 1: Palette RED and GREEN

**Files:**
- Modify: `src/app/MujocoCheckerFloor.test.ts`
- Modify: `src/app/SceneViewport.test.tsx`
- Modify: `src/app/MujocoCheckerFloor.tsx`
- Modify: `src/app/SceneViewport.tsx`
- Modify: `src/ui/theme/base.css`

**Interfaces:**
- Consumes: `createMujocoCheckerTexture()` and the current static viewport.
- Produces: the same texture and viewport interfaces with deeper literal colors.

- [x] **Step 1: Change the texture and viewport expectations to the approved new literal colors.**
- [x] **Step 2: Run the two focused tests and confirm both fail against the current bright palette.**
- [x] **Step 3: Replace the background/fog, checker pixels, viewport frame, and fallback checker colors.**
- [x] **Step 4: Re-run the focused tests and confirm they pass.**

### Task 2: Six-scene verification and deployment

**Files:**
- Create: `project/checkpoints/2026-08-13-deeper-showroom-palette/*.png`
- Modify: `README.md`
- Modify: `project/task_plan.md`
- Modify: `project/decision_log.md`
- Modify: `project/standup_log.md`
- Modify: `project/next_actions.md`

**Interfaces:**
- Consumes: all six `?scene=demo01..06` routes.
- Produces: six screenshots, a contact sheet, project records, and a Pages deployment.

- [x] **Step 1: Run `npm run test:all`, `npm run test:scenes`, `npm run test:static-scenes`, and `npm run build`.**
- [x] **Step 2: Run all six Playwright cases, regenerate the 3×2 contact sheet, and inspect it at original resolution.**
- [x] **Step 3: Update README and project tracking with the new checkpoint.**
- [ ] **Step 4: Commit, push through `github-Shuaijun-LIU`, and verify the Pages run plus public Chromium probe.**
