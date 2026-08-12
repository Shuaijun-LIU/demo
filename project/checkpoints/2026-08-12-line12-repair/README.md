# Line1 / Line2 physics and motion repair checkpoint

Date: 2026-08-12

## User-reported defects recorded

- Panda arms did not perform visible task motion.
- Workpieces moved independently from the arms and intersected fixtures.
- Panda bases were mounted near the floor instead of at tabletop height.
- Line2 GLB resources used the wrong up axis, oversized hand-tuned scales, and overlapped primitive proxies.
- The earlier Line3 result remains rejected and is not part of this repair.

## Repairs in this checkpoint

- All twelve MJCF files now use gravity `0 0 -9.81` with contact enabled.
- All Panda mounting frames are aligned to their work-surface heights; support columns extend continuously from floor to mounting plane.
- Every scene has a named `task_payload` free body with mass, friction, and a collision shape; the corresponding static proxy is hidden.
- RoboTwin GLBs use recorded source scales, explicit Y-up to Z-up conversion, and bottom-center origin normalization.
- One representative Line2 GLB per scene reads the authoritative `task_payload` position and quaternion from MuJoCo.
- The old sinusoidal joint preview is replaced by per-scene, per-arm smooth keyframes. During the custody interval, the task payload follows the active Panda hand and is released back to physics.
- Each scene now selects a reachable carrier arm and uses a MuJoCo forward-kinematics calibrated grasp pose; 11/12 grasp gaps are below 1 cm and the remaining gap is 3.6 cm.
- Every primitive visually replaced by a RoboTwin GLB is moved to a hidden render group while retaining static collision geometry, removing the previous doubled/overlapping appearance.
- The pharmacy primary payload is now the reachable A1 medicine carton; A2 remains a shelf item.

## Evidence

- `demo01-line2-playing.png` … `demo06-line2-playing.png`: six Line2 playback-state screenshots.
- `line2-contact-sheet.png`: two-column visual review sheet of all six Line2 scenes captured near the calibrated grasp phase.
- `demo05-line2-ik-grasp.png`: focused pharmacy checkpoint showing the revised A1 carton and four-arm workcell during task motion.
- Direct `mujoco-js` compile audit: all 12 scenes compiled successfully; 3-arm scenes report `nq=34/nv=33/nu=24`, 4-arm scenes report `nq=43/nv=42/nu=32`.
- Browser probe: all 12 scenes reached the loaded state, playback was triggered, before/after PNG buffers changed materially, and browser error count was zero.
- Final unit regression: 102/102 passing; contract suite exits cleanly; Chromium E2E 12/12 passing.

## Review caveat

These are deterministic investor-demo trajectories with offline IK/FK-calibrated grasp approaches, not learned production manipulation policies. They establish visible robot-led motion, physical scene ownership, and near-contact pickup geometry; fine orientation and finger closure remain a later visual-refinement layer.
