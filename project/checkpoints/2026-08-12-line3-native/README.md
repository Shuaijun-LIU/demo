# Line3 native MuJoCo checkpoint

This checkpoint records the first complete executable Line3 baseline built on 2026-08-12.

## What is implemented

- Six native MuJoCo tasks: Demo01/03/06 use three MuJoCo Menagerie Franka Pandas; Demo02/04/05 use four.
- Per-arm continuous control: seven joint-position deltas plus gripper/tool command.
- Deterministic reset and exact state restore across MuJoCo dynamics, PRNG, task graph, objects, tools, locks, custody, fault state and trace.
- Task-specific multi-arm phase graphs, one declared business fault and recovery branch, typed success oracles, and disabled-arm counterfactuals.
- MIT RoboTwin2 asset registry with exact file hashes, physical metadata and native drop/settle validation.
- Six Gymnasium IDs, six exported MJCF scenes/manifests, six expert datasets, six MP4 videos and a 600-episode fixed-seed report.

## Visual artifacts

- `line3-six-scene-contact-sheet.jpg`: 3×2 overview of the six native scenes.
- `demo01-native.png` … `demo06-native.png`: 640×480 first frames from the accepted EGL-rendered expert videos.
- Full videos: `simulation/line3/artifacts/videos/demo01.mp4` through `demo06.mp4`.

These are actual native MuJoCo 3.6 EGL renderer outputs, not browser mockups. Each robot uses the original Menagerie Franka visual and collision meshes. Workpieces use collidable physical proxies and move continuously with the active collaboration stage; cable and soft-fruit fidelity remains a stable constrained approximation that can be upgraded without changing task IDs, controller interfaces or data schema.

## Verification snapshot

- Python tests: 41/41 passing.
- Asset audit: 8/8 hashes and 8/8 native drop/settle checks passing.
- Expert matrix: Demo01–Demo06 each 100/100, 600/600 total.
- Business faults: exactly one declared fault per accepted episode.
- Disabled-arm counterfactual: every declared arm is necessary.
- Expert data: all six NPZ files round-trip with matching SHA-256.
- Video: all six EGL-rendered episodes end with `oracle.success == True`.

Reproduction commands are in `simulation/line3/README.md`.
