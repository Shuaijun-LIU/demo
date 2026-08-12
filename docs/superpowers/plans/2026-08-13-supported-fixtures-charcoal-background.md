# Supported Fixtures and Charcoal Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add continuous physical-looking support structures to the floating Demo 03 and Demo 06 equipment, and change the 3D viewport to near-black charcoal grey.

**Architecture:** Keep scene geometry inside each MJCF and validate named support chains with axis-aligned bounds derived from real `pos` and `size` values. Keep the global background change isolated to `SceneViewport` and the viewport CSS fallback.

**Tech Stack:** MuJoCo MJCF, TypeScript, Vitest, React Three Fiber, Playwright.

## Global Constraints

- `scale_display_post` must touch both `scale` and `scale_display`.
- Both pitter frame posts must touch `pitter_base` and `pitter_bridge`; the bridge must remain connected to both pitter heads.
- Viewport background/fog/container must use `#252a2e`.
- Do not change object positions, camera, lights, checker colors, white lines, Panda poses, or collision tolerance.

---

### Task 1: Support-chain regression tests and fixtures

**Files:**
- Create: `src/scenarios/fixtureSupport.test.ts`
- Modify: `public/scenarios/demo03/scene.xml`
- Modify: `public/scenarios/demo06/scene.xml`

**Interfaces:**
- Consumes: named axis-aligned box geoms with `pos` and `size`.
- Produces: support-chain tests based on actual AABB contact, plus three named support geoms.

- [x] **Step 1:** Add tests for `scale → scale_display_post → scale_display` and `pitter_base → pitter_frame_post_left/right → pitter_bridge → pitter_head_1/2`.
- [x] **Step 2:** Run the focused test and confirm it fails because the three support geoms are absent.
- [x] **Step 3:** Add the display post and two frame posts with exact touching heights.
- [x] **Step 4:** Re-run the focused test, scene compilation, and static penetration check.

### Task 2: Charcoal viewport background

**Files:**
- Modify: `src/app/SceneViewport.test.tsx`
- Modify: `src/app/SceneViewport.tsx`
- Modify: `src/ui/theme/base.css`

**Interfaces:**
- Produces: the same paused viewport using `#252a2e` for background, fog, and pre-canvas container.

- [x] **Step 1:** Change the viewport test to require `#252a2e` and reject `#d2d5d4`.
- [x] **Step 2:** Run the focused test and confirm it fails against the current medium-grey background.
- [x] **Step 3:** Replace the background/fog/container values only.
- [x] **Step 4:** Re-run the focused test and typecheck.

### Task 3: Browser evidence and deployment

**Files:**
- Modify: `tests/e2e/static-showroom.spec.ts`
- Create: `project/checkpoints/2026-08-13-supported-fixtures-charcoal-background/*.png`
- Modify: `README.md`
- Modify: `project/*.md`

**Interfaces:**
- Consumes: all six static scene routes.
- Produces: six screenshots, a contact sheet, updated project records, and verified Pages deployment.

- [x] **Step 1:** Run full unit/contract, scene compile, penetration, build, and six-scene Playwright verification.
- [x] **Step 2:** Inspect the full contact sheet and original Demo 03/06 screenshots.
- [x] **Step 3:** Update README, checkpoint, and project tracking with the verified local evidence.
- [ ] **Step 4:** Verify Pages Actions and public Chromium MuJoCo ready with no page/request errors.
