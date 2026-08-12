# Line3 Native MuJoCo

Line3 is a native MuJoCo 3.6 task suite for six reusable multi-Franka collaboration simulations. It uses the repository's Apache-2.0 MuJoCo Menagerie Franka Panda model, is independent from the Line1/Line2 web bundle, and exposes deterministic state replay, typed success oracles, one-shot business faults, continuous joint control, expert data, and Gymnasium APIs.

## Tasks

| Gymnasium ID | Arms | Task | One-shot fault and recovery |
|---|---:|---|---|
| `MultiPanda-Demo01-v0` | 3 | Electronics inspection / probe test / routing | P3 lacks rear marker and is routed NG |
| `MultiPanda-Demo02-v0` | 4 | Harness anchoring / routing / clip pressing | C2 latch offset requires held realignment and repress |
| `MultiPanda-Demo03-v0` | 3 | Food cartoning / labeling / weighing | K3 lacks outside date label and is routed NG |
| `MultiPanda-Demo04-v0` | 4 | Supported structure assembly / fastening | F2 switch miss requires retry while support is held |
| `MultiPanda-Demo05-v0` | 4 | Pharmacy scan / correction / packaging gate | Wrong B3 is returned and B1 is repicked before PASS |
| `MultiPanda-Demo06-v0` | 3 | Fruit inspection / pitting / packing | G5 retains its pit and goes through repit/reverify |

Every task uses concatenated continuous actions per arm: seven joint-position deltas and one gripper/tool command. The observation includes per-arm joint state, end-effector pose, tool state, object poses, contact summary, phase, locks, custody, and a 16-value task sensor vector.

## Install and run

Python 3.10–3.12 is supported. From this directory:

```bash
python -m venv .venv
.venv/bin/pip install -e '.[test]'
.venv/bin/line3 list
.venv/bin/line3 run demo05 --seed 20260812
```

Gymnasium use:

```python
import gymnasium as gym
import line3

env = gym.make("MultiPanda-Demo02-v0")
observation, info = env.reset(seed=20260812)
observation, reward, terminated, truncated, info = env.step(env.unwrapped.expert_action())
```

Export standalone task MJCF and manifests:

```bash
.venv/bin/python scripts/export_scenes.py
```

The generated sources live under `line3/models/demo01` through `demo06`. They compile with native MuJoCo; the Python task plugins remain the authoritative source for the phase graph and oracle.

## Reproduce validation and evidence

```bash
.venv/bin/pytest -q
.venv/bin/python scripts/validate_assets.py --all
.venv/bin/python scripts/run_matrix.py --episodes 100 --output artifacts/matrix-report.json
.venv/bin/python scripts/record_experts.py --output-dir artifacts/experts
CUDA_VISIBLE_DEVICES=6 MUJOCO_GL=egl .venv/bin/python scripts/render_tasks.py --output-dir artifacts/videos
```

Recorded outputs:

- `artifacts/matrix-report.json`: all 600 fixed-seed expert episodes and per-task summaries.
- `artifacts/experts/*.npz`: observations, continuous actions, task events, oracle predicates, seed and asset-manifest hash.
- `artifacts/videos/*.mp4`: six native MuJoCo expert episodes.
- `project/checkpoints/2026-08-12-line3-native/`: six preview frames and a contact sheet for visual review.

## Determinism and task semantics

`get_state()` captures MuJoCo `qpos`, `qvel`, controls, warmstart acceleration and time together with PRNG state, task phase, object poses, custody, locks, tools, one-shot fault state, timers, semantic task state and trace. `set_state()` restores all of them; the next observation, trace hash and state hash are reproduced exactly.

The task oracle is independent of reward. It explicitly checks the declared outcome, exactly one business fault, recovery completion, inventory conservation and safe final joints. Disabling any declared arm causes the expert episode to time out rather than silently reassigning its role.

## Asset policy

The eight recognizable object assets reuse the repository's MIT-licensed RoboTwin2 files under `public/assets/line2`. `line3.assets.registry` records exact SHA-256, SI extents, mass, inertia, friction and collision-proxy method. Native drop/settle validation runs for every proxy. MuJoCo 3.6 does not decode GLB directly, so task environments use audited primitive/convex collision proxies while source GLBs stay registered for the next visual-mesh conversion pass. Stable constrained approximations are used for cable and fruit; their interface allows later fidelity upgrades without changing task IDs or data schema.

Every runtime and exported scene contains three or four independently prefixed Menagerie Pandas with the original visual and collision meshes. The stable public control schema aggregates the two finger joints into one total-opening channel, while native state restore keeps all nine qpos and eight actuators per arm. Task workpieces have MuJoCo collision properties, move continuously with the active collaboration stage, and feed per-arm native contact-force observations. The robots are arranged in native Z-up coordinates and all six scenes use the same overview camera and subdued industrial palette.

## Current acceptance result

On 2026-08-12, the recorded baseline passed:

- 41 unit/contract tests, including real Menagerie dimensions, six portable MJCF compiles, deterministic restore, native object contact/motion and all-arm counterfactuals;
- 8/8 asset provenance/hash/physics audits and native drop/settle checks;
- 100/100 fixed-seed expert episodes for each of six tasks (600/600 total);
- six expert NPZ round trips and six EGL-rendered MP4s;
- all six typed oracles with exactly one declared business fault per episode.

The implementation follows `docs/superpowers/plans/2026-08-12-line3-native-mujoco-tasks.md`.
