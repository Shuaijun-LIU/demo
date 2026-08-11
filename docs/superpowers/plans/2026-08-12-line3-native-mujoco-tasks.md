# Line3 Native MuJoCo Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Planning status (2026-08-12):** Detailed six-task native MuJoCo plan is complete and recorded; implementation intentionally starts only after Line2 review.

**Goal:** Build six reusable native MuJoCo multi-Franka tasks with deterministic reset, physical interaction, sensors, faults, success oracles, expert demonstrations, and benchmark-compatible data interfaces.

**Architecture:** A Python package under `simulation/line3` owns a shared multi-arm environment, MJCF assembly, controller adapters, typed snapshots, task graph primitives, recording, and validation. Each Demo is a plugin containing task assets, reset sampler, phase graph, fault injector, oracle, and tests; web assets may be reused visually but native collision/inertia assets are generated and audited separately.

**Tech Stack:** Python 3.11, MuJoCo 3.x, NumPy, pytest, Gymnasium-compatible API, imageio/ffmpeg for evidence videos; optional trimesh/VHACD or CoACD asset preprocessing.

## Global Constraints

- This document is planning-only during the Line2 delivery; implementation starts in a later native-simulation phase.
- Demo 01/03/06 have three Panda arms; Demo 02/04/05 have four.
- `reset(seed)` and state restore reproduce task graph, PRNG, MuJoCo state, tools, custody, locks, fault count, and timers.
- Every episode injects at most one declared business fault; infrastructure faults are separate and make acceptance runs fail.
- Success is a typed Boolean oracle over state and tolerances, not a reward threshold.
- Public/reproducible assets require source, license, hash, scale, inertia, collision method, and conversion command.
- First implementation uses stable constrained approximations for flexible cable and soft fruit; higher fidelity is an optional measured upgrade.

---

## Target repository structure

```text
simulation/line3/
  pyproject.toml
  README.md
  line3/
    env.py
    types.py
    state.py
    mjcf_builder.py
    controllers.py
    coordination.py
    tools.py
    faults.py
    recording.py
    assets/registry.py
    tasks/demo01.py ... demo06.py
    models/shared/panda.xml
    models/demo01/scene.xml ... demo06/scene.xml
  scripts/
    build_assets.py
    validate_assets.py
    record_expert.py
    render_task.py
  tests/
    test_env_contract.py
    test_state_restore.py
    test_asset_registry.py
    test_demo01.py ... test_demo06.py
```

## Shared interface contract

```python
@dataclass(frozen=True)
class OracleResult:
    success: bool
    predicates: dict[str, bool]
    metrics: dict[str, float]

class Line3Env(gym.Env):
    def reset(self, *, seed: int | None = None, options: dict | None = None): ...
    def step(self, action: np.ndarray): ...
    def get_state(self) -> ScenarioState: ...
    def set_state(self, state: ScenarioState) -> None: ...
    def oracle(self) -> OracleResult: ...
```

Actions are concatenated per arm: 7 joint-position deltas plus one gripper/tool command. Observations include joint position/velocity, end-effector pose, gripper/tool state, task object poses, contacts/forces, phase, locks, custody, and task sensors. A skill-level discrete wrapper may be added without changing the base environment.

### Task 1: Package, deterministic state, and multi-arm builder

**Files:** shared package and `tests/test_env_contract.py`, `tests/test_state_restore.py`.

- [ ] Write failing tests that reset twice with seed 20260812, compare observation/state hashes, step 20 fixed actions, restore the checkpoint, and reproduce the next observation exactly.
- [ ] Implement `ScenarioState` with `qpos`, `qvel`, `ctrl`, `time`, task phase, PRNG bit generator state, custody, locks, tools, business-fault count, and timers.
- [ ] Implement `MjcfBuilder.add_panda(prefix, pose)` and assert globally unique body/joint/site/actuator/sensor names for four attached Pandas.
- [ ] Add action/observation validation and terminate with structured reason codes.
- [ ] Run `pytest tests/test_env_contract.py tests/test_state_restore.py -q`; commit `feat(line3): add deterministic multi-arm environment`.

### Task 2: Asset build and physical-property audit

**Files:** asset registry, build/validation scripts, source manifests, generated local-only/redistributable directories.

- [ ] Write failing registry tests requiring source URL/path, SPDX license, SHA-256, units, visual mesh, collision mesh, mass, inertia source, friction, and redistribution flag.
- [ ] Implement conversion pipeline: normalize to meters/Z-up, repair normals, center on declared frame, simplify visual mesh, build convex collision parts, compute mass properties, and emit MJCF asset fragments.
- [ ] Validate watertightness where required, positive inertia, nonzero extents, collision part count, and a 2-second drop/settle test.
- [ ] Register local RoboTwin2/Menagerie assets first; keep NIST/CC-BY candidates disabled until per-file license and attribution are recorded.
- [ ] Run `python scripts/validate_assets.py --all && pytest tests/test_asset_registry.py -q`; commit `feat(line3): add audited simulation asset pipeline`.

### Task 3: Coordination, tools, sensors, and expert recorder

**Files:** `coordination.py`, `tools.py`, `controllers.py`, `recording.py`, shared tests.

- [ ] Write failing tests for ZoneLock order, Barrier arrival, Handoff confirmation, HoldWhile violation, tool dock attach/detach, and trace equality after state restore.
- [ ] Implement semantic sites and tool adapters for parallel gripper, vacuum head, probe, clip press, electric driver, scanner, soft fingers, and pitting head.
- [ ] Add joint-space controller and Cartesian damped-least-squares controller with joint/velocity/force clipping.
- [ ] Record observations, actions, contacts, task events, oracle predicates, RGB/depth/segmentation frames, seed, and asset manifest hash.
- [ ] Run shared coordination/controller/recording tests; commit `feat(line3): add coordination tools and recording`.

### Task 4: Demo01 electronics inspection and functional test

**Assets:** Panda×3, battery/PCB/test-part variants, ESD tray, scanner, flip fixture, test socket/probe, A/B/NG trays.

**Phases:** `singulate → scan → handoff → flip_front → flip_back → probe_test → route`; pipeline overlaps the next part after handoff.

**Physics/sensors:** rigid grasp contacts, fixture hinge or equality constraint, front/back marker sites, probe contact/force, socket occupancy.

**Fault:** exactly P3 lacks rear marker; it bypasses probe test and routes to NG.

**Oracle:** P1 A1, P2 B1, P3 NG, P4 B2, P5 A2; probe docked; inventory conserved; all arms safe; duration≤90 s.

- [ ] Write failing reset, nominal, P3-recovery, state-restore, and disabled-arm tests.
- [ ] Build MJCF and expert state machine using Handoff and ZoneLock.
- [ ] Tune friction/contact so 100 fixed-seed expert episodes achieve 100/100 without infrastructure fallback.
- [ ] Record an expert `.npz` and MP4; commit `feat(line3): add electronics inspection task`.

### Task 5: Demo02 automotive harness routing

**Assets:** Panda×4, S0/S1 connectors, segmented cable, C1–C3 clips, B1 branch, clip press tool, routing board.

**Phases:** `seat_s0 → acquire_three_anchors → route_main → seat_s1 → press_c1 → press_c2 → recover_c2 → press_c3 → branch_b1 → inspect → release`.

**Physics/sensors:** first version uses capsules linked by ball joints/tendons plus anchor constraints; connector insertion force/site distance, clip joint position, path RMS, and normalized tendon tension are observed.

**Fault:** C2 latch limit is offset on first press, requiring retract/realign/repress while Arms 1–3 hold.

**Oracle:** connectors locked, four clip/branch predicates true, RMS≤25 mm, tension `[0.25,0.75]`, anchors released, all arms safe.

- [ ] Test three-anchor necessity, tension violation, C2 recovery, path metric, reset, and restore.
- [ ] Implement stable constrained-cable model before evaluating flexcomp/soft-body alternatives.
- [ ] Run 100 expert seeds and log success, peak contact force, RMS, and real-time factor; commit `feat(line3): add harness routing task`.

### Task 6: Demo03 flexible food cartoning

**Assets:** Panda×3, A/B foods, blue/yellow cartons, carton fixture, label, scale, output/NG conveyors.

**Phases:** `supply → select_carton → erect → hold → load → close → label → weigh → inspect → route`.

**Physics/sensors:** product-in-box containment, carton fixture contacts, scale force sum, outside label site visibility.

**Fault:** K3's outside date label is absent; route to NG without reclassifying it as good.

**Oracle:** K1 Blue-1, K2 Yellow-1, K3 NG, K4 Yellow-2, K5 Blue-2; contents/box inventory conserved; arms safe; duration≤90 s.

- [ ] Test HoldWhile break, containment, weight tolerance, missing label, disabled supply/hold/load arms, reset, and restore.
- [ ] Build deterministic expert pipeline and record evidence; commit `feat(line3): add food cartoning task`.

### Task 7: Demo04 supported structure assembly

**Assets:** Panda×4, beam, plate, fixture, F1/F2 fasteners, driver/probe, support pad, seam scanner.

**Phases:** `place_beam → align_plate → support → barrier → tool_pick → fasten_f1 → fasten_f2 → recover_f2 → scan → fixture_takeover → tool_return`.

**Physics/sensors:** multi-anchor equality/contacts, plate pose, guided fastener insertion, driver torque/contact proxy, F1/F2 position switches, seam scan trajectory.

**Fault:** F2 first attempt does not reach its position switch; Arm 3 retracts and retries while Arms 1/2/4 maintain HoldWhile predicates.

**Oracle:** plate angle `90°±3°`, datum error≤15 mm, F1/F2 and seam true, fixture custody, tool docked, all arms safe.

- [ ] Test every supporting arm's necessity, F2 recovery, pose tolerances, tool custody, reset, and restore.
- [ ] Enforce Panda payload-scaled model naming so the task demonstrates coordination without claiming real heavy lifting.
- [ ] Record fixed-seed expert data/video; commit `feat(line3): add supported assembly task`.

### Task 8: Demo05 pharmacy verification and packaging

**Assets:** Panda×4, A/B/C medicine boxes or bottles, shelves, RX-01/RX-02 merge trays, scanner, counter, return bin, cartons, sealer, pickup window.

**Phases:** `pick_a_and_bc → lock_rx_merge → scan_count → detect_b3 → return_b3 → repick_b1 → rescan → pass_gate → package → deliver`.

**Physics/sensors:** shelf/bin occupancy, barcode semantic sensor, tray containment, count/inventory events, packaging gate and seal state.

**Fault:** seed `RX-20260812` makes RX-02 receive B3 instead of B1 once; Arm 3 isolates it, Arm 2 repicks B1, Arm 4 remains blocked until PASS.

**Oracle:** RX-01 `{A1,B2}`, RX-02 `{A2,B1,C1}`, B3 return bin, two sealed packages, full inventory conservation, all arms safe, duration≤90 s.

- [ ] Test four-arm count, order-zone lock, wrong-drug isolation, packaging gate, inventory conservation, disabled-arm SLA, reset, and restore.
- [ ] Record two-order expert trace and barcode/count evidence; commit `feat(line3): add pharmacy task`.

### Task 9: Demo06 fruit inspection, pitting, and rework

**Assets:** Panda×3, apples/fruit variants, soft fingers, inspection turntable, pitter, removable pit constraints, product tray, unripe/NG/pit/rework bins.

**Phases:** `pick_rotate_inspect → classify → handoff → orient → pit → verify → pack`, with `rework_g5 → repit → reverify`.

**Physics/sensors:** compliant contact parameters, fruit orientation, pit equality constraint released by successful pitting stroke, opening/pit-presence sites.

**Fault:** G5's first stroke does not release the pit; G2 unripe and G4 surface NG remain normal quality classifications.

**Oracle:** G1/G3/G5/G6 pitted in four-cell tray, four pits in pit bin, G2 unripe, G4 NG, tools reset, arms safe, duration≤100 s.

- [ ] Test classification versus fault count, pit release, G5 recovery, soft-grip force limit, disabled arms, reset, and restore.
- [ ] Compare constrained rigid-fruit approximation against one higher-fidelity contact model; retain the more stable model unless fidelity improves a declared metric.
- [ ] Record expert data/video; commit `feat(line3): add fruit processing task`.

### Task 10: Benchmark wrapper, matrix validation, and release evidence

**Files:** Gymnasium registration, CLI, matrix tests, dataset schema, README, benchmark report.

- [ ] Register `MultiPanda-Demo01-v0` through `MultiPanda-Demo06-v0`; validate action/observation spaces with Gymnasium checker.
- [ ] Run every task over 100 fixed evaluation seeds, state-restore tests, single-arm-disable counterfactuals, and a 10-minute memory/performance soak.
- [ ] Export expert episodes with manifest/version hashes and verify round-trip loading.
- [ ] Render consistent overview and fault-recovery MP4s; report success rate, mean duration, peak force, real-time factor, and oracle failures per task.
- [ ] Run `pytest -q`, headless smoke matrix, asset audit, dataset round-trip, and video generation from a clean environment.
- [ ] Commit `feat(line3): release native multi-arm task suite` and tag the separately approved Line3 release.

## Line3 acceptance gate

Line3 is complete only when all six registered environments reset and step headlessly, fixed seeds replay exactly, expert runs satisfy their typed oracles without infrastructure fallback, each business fault appears exactly once on its acceptance seed, every disabled-arm counterfactual fails as specified, assets pass license/physics audits, and expert datasets/videos reproduce from documented commands.
