from __future__ import annotations

import copy
import hashlib
import json
from typing import Any

import gymnasium as gym
import mujoco
import numpy as np
from gymnasium import spaces
from numpy.typing import NDArray

from line3.mjcf_builder import MjcfBuilder
from line3.state import state_hash, trace_hash
from line3.types import OracleResult, ScenarioState


class Line3Env(gym.Env[dict[str, NDArray[np.float64]], NDArray[np.float32]]):
    metadata = {"render_modes": ["rgb_array"], "render_fps": 25}

    def __init__(
        self,
        *,
        arm_count: int,
        horizon: int = 500,
        frame_skip: int = 5,
        object_count: int = 8,
        render_mode: str | None = None,
        builder: MjcfBuilder | None = None,
    ) -> None:
        super().__init__()
        if arm_count not in (3, 4):
            raise ValueError("arm_count must be 3 or 4")
        if horizon <= 0 or frame_skip <= 0 or object_count <= 0:
            raise ValueError("horizon, frame_skip, and object_count must be positive")
        if render_mode not in (None, "rgb_array"):
            raise ValueError("render_mode must be None or 'rgb_array'")
        self.arm_count = arm_count
        self.horizon = horizon
        self.frame_skip = frame_skip
        self.object_count = object_count
        self.render_mode = render_mode
        self._builder = builder or self._make_builder(arm_count)
        self.model = self._builder.compile()
        self.data = mujoco.MjData(self.model)
        self._joint_qpos_addresses = np.asarray(
            [[self.model.joint(f"arm{arm}_joint{joint}").qposadr[0] for joint in range(1, 8)] for arm in range(1, arm_count + 1)],
            dtype=np.int32,
        )
        self._finger_qpos_addresses = np.asarray(
            [[self.model.joint(f"arm{arm}_finger_joint1").qposadr[0], self.model.joint(f"arm{arm}_finger_joint2").qposadr[0]] for arm in range(1, arm_count + 1)],
            dtype=np.int32,
        )
        self._joint_dof_addresses = np.asarray(
            [[self.model.joint(f"arm{arm}_joint{joint}").dofadr[0] for joint in range(1, 8)] for arm in range(1, arm_count + 1)],
            dtype=np.int32,
        )
        self._finger_dof_addresses = np.asarray(
            [[self.model.joint(f"arm{arm}_finger_joint1").dofadr[0], self.model.joint(f"arm{arm}_finger_joint2").dofadr[0]] for arm in range(1, arm_count + 1)],
            dtype=np.int32,
        )
        self._home_ctrl = np.tile(np.asarray([0, -0.9, 0, -2.0, 0, 2.4, 0.7, 255.0], dtype=np.float64), arm_count)
        self._home_qpos = np.zeros(self.model.nq, dtype=np.float64)
        self._home_qpos[self._joint_qpos_addresses] = self._home_ctrl.reshape(arm_count, 8)[:, :7]
        self._home_qpos[self._finger_qpos_addresses] = 0.04
        self._rng = np.random.default_rng()
        self._phase = 0
        self._step_count = 0
        self._object_pose = np.zeros((object_count, 7), dtype=np.float64)
        self._object_pose[:, 3] = 1.0
        self._custody: dict[str, str] = {}
        self._locks: dict[str, str] = {}
        self._tools = {f"arm{index}": "parallel_gripper" for index in range(1, arm_count + 1)}
        self._business_fault_count = 0
        self._timers: dict[str, float] = {}
        self._trace: list[str] = []
        self._renderer: mujoco.Renderer | None = None

        action_limit = np.ones(arm_count * 8, dtype=np.float32)
        self.action_space = spaces.Box(-action_limit, action_limit, dtype=np.float32)
        self.observation_space = spaces.Dict(
            {
                "joint_position": spaces.Box(-np.inf, np.inf, shape=(arm_count, 8), dtype=np.float64),
                "joint_velocity": spaces.Box(-np.inf, np.inf, shape=(arm_count, 8), dtype=np.float64),
                "end_effector_pose": spaces.Box(-np.inf, np.inf, shape=(arm_count, 7), dtype=np.float64),
                "gripper_tool_state": spaces.Box(-np.inf, np.inf, shape=(arm_count, 2), dtype=np.float64),
                "object_pose": spaces.Box(-np.inf, np.inf, shape=(object_count, 7), dtype=np.float64),
                "contact_force": spaces.Box(0.0, np.inf, shape=(arm_count,), dtype=np.float64),
                "phase": spaces.Box(0, np.iinfo(np.int32).max, shape=(1,), dtype=np.int32),
                "lock_state": spaces.Box(0, 1, shape=(arm_count,), dtype=np.int8),
                "custody_state": spaces.Box(-1, arm_count, shape=(object_count,), dtype=np.int16),
            }
        )

    @staticmethod
    def _make_builder(arm_count: int) -> MjcfBuilder:
        layouts = {
            3: ((-0.85, -0.55, 0.35), (0.85, -0.55, 2.79), (0.0, 0.85, -1.57)),
            4: ((-0.85, -0.65, 0.55), (0.85, -0.65, 2.59), (0.85, 0.65, -2.59), (-0.85, 0.65, -0.55)),
        }
        builder = MjcfBuilder()
        for index, pose in enumerate(layouts[arm_count], start=1):
            builder.add_panda(f"arm{index}_", pose)
        return builder

    def reset(
        self,
        *,
        seed: int | None = None,
        options: dict[str, Any] | None = None,
    ) -> tuple[dict[str, NDArray[np.float64]], dict[str, Any]]:
        super().reset(seed=seed)
        self._rng = np.random.default_rng(seed)
        mujoco.mj_resetData(self.model, self.data)
        self.data.qpos[:] = self._home_qpos
        self.data.ctrl[:] = self._home_ctrl
        self.data.qvel[:] = 0.0
        self._phase = 0
        self._step_count = 0
        self._object_pose.fill(0.0)
        self._object_pose[:, :3] = self._rng.uniform((-0.35, -0.25, 0.72), (0.35, 0.25, 0.9), size=(self.object_count, 3))
        self._object_pose[:, 3] = 1.0
        self._custody = {}
        self._locks = {}
        self._tools = {f"arm{index}": "parallel_gripper" for index in range(1, self.arm_count + 1)}
        self._business_fault_count = 0
        self._timers = {}
        self._trace = [self._event("reset", {"seed": seed, "options": options or {}})]
        self._reset_task_state(options or {})
        mujoco.mj_forward(self.model, self.data)
        state = self.get_state()
        return self._observation(), {"reason_code": "reset", "state_hash": state_hash(state), "trace_hash": trace_hash(state.trace)}

    def step(
        self, action: NDArray[np.float32]
    ) -> tuple[dict[str, NDArray[np.float64]], float, bool, bool, dict[str, Any]]:
        action_array = np.asarray(action, dtype=np.float64)
        if action_array.shape != self.action_space.shape:
            raise ValueError(f"action shape must be {self.action_space.shape}, got {action_array.shape}")
        if not np.isfinite(action_array).all():
            raise ValueError("action must contain only finite values")
        clipped = np.clip(action_array, -1.0, 1.0).reshape(self.arm_count, 8)
        deltas = clipped * np.asarray([0.025] * 7 + [0.0025])
        deltas[:, 7] *= 255.0 / 0.08
        targets = self.data.ctrl.reshape(self.arm_count, 8) + deltas
        ctrl_ranges = self.model.actuator_ctrlrange.reshape(self.arm_count, 8, 2)
        self.data.ctrl[:] = np.clip(targets, ctrl_ranges[:, :, 0], ctrl_ranges[:, :, 1]).reshape(-1)
        for _ in range(self.frame_skip):
            mujoco.mj_step(self.model, self.data)
        self._step_count += 1
        self._timers["episode"] = float(self.data.time)
        self._after_physics_step(action_array)
        self._trace.append(
            self._event(
                "step",
                {
                    "index": self._step_count,
                    "action_hash": hashlib.sha256(action_array.tobytes()).hexdigest(),
                    "time": float(self.data.time),
                },
            )
        )
        terminated = self.oracle().success
        truncated = self._step_count >= self.horizon and not terminated
        reason = "success" if terminated else "time_limit" if truncated else "running"
        state = self.get_state()
        return self._observation(), 1.0 if terminated else 0.0, terminated, truncated, {
            "reason_code": reason,
            "state_hash": state_hash(state),
            "trace_hash": trace_hash(state.trace),
        }

    def _observation(self) -> dict[str, NDArray[np.float64]]:
        arm_joints = self.data.qpos[self._joint_qpos_addresses].copy()
        gripper_opening = self.data.qpos[self._finger_qpos_addresses].sum(axis=1, keepdims=True)
        joint_position = np.concatenate((arm_joints, gripper_opening), axis=1)
        arm_velocity = self.data.qvel[self._joint_dof_addresses].copy()
        gripper_velocity = self.data.qvel[self._finger_dof_addresses].sum(axis=1, keepdims=True)
        joint_velocity = np.concatenate((arm_velocity, gripper_velocity), axis=1)
        ee_pose = np.zeros((self.arm_count, 7), dtype=np.float64)
        contact_force = np.zeros(self.arm_count, dtype=np.float64)
        for arm in range(self.arm_count):
            site_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_SITE, f"arm{arm + 1}_ee_site")
            ee_pose[arm, :3] = self.data.site_xpos[site_id]
            mujoco.mju_mat2Quat(ee_pose[arm, 3:], self.data.site_xmat[site_id])
        force = np.zeros(6, dtype=np.float64)
        for contact_index in range(self.data.ncon):
            contact = self.data.contact[contact_index]
            mujoco.mj_contactForce(self.model, self.data, contact_index, force)
            magnitude = float(np.linalg.norm(force[:3]))
            involved_arms: set[int] = set()
            for geom_id in (int(contact.geom1), int(contact.geom2)):
                body_id = int(self.model.geom_bodyid[geom_id])
                while body_id:
                    body_name = mujoco.mj_id2name(self.model, mujoco.mjtObj.mjOBJ_BODY, body_id)
                    matched = False
                    for arm in range(self.arm_count):
                        if body_name and body_name.startswith(f"arm{arm + 1}_"):
                            involved_arms.add(arm)
                            matched = True
                            break
                    if matched:
                        break
                    body_id = int(self.model.body_parentid[body_id])
            for arm in involved_arms:
                contact_force[arm] += magnitude
        gripper_tool_state = np.column_stack((joint_position[:, 7], np.ones(self.arm_count, dtype=np.float64)))
        lock_state = np.asarray([int(f"arm{arm + 1}" in self._locks.values()) for arm in range(self.arm_count)], dtype=np.int8)
        custody_state = np.full(self.object_count, -1, dtype=np.int16)
        for index in range(self.object_count):
            holder = self._custody.get(f"object{index}")
            if holder and holder.startswith("arm"):
                custody_state[index] = int(holder[3:]) - 1
        return {
            "joint_position": joint_position,
            "joint_velocity": joint_velocity,
            "end_effector_pose": ee_pose,
            "gripper_tool_state": gripper_tool_state,
            "object_pose": self._object_pose.copy(),
            "contact_force": contact_force,
            "phase": np.asarray([self._phase], dtype=np.int32),
            "lock_state": lock_state,
            "custody_state": custody_state,
        }

    def _semantic_ctrl(self, *, home: bool = False) -> NDArray[np.float64]:
        """Expose actuator targets as seven joints plus gripper opening in metres."""
        controls = self._home_ctrl if home else self.data.ctrl
        semantic = controls.reshape(self.arm_count, 8).copy()
        semantic[:, 7] *= 0.08 / 255.0
        return semantic

    def _semantic_qpos(self, *, home: bool = False) -> NDArray[np.float64]:
        """Expose MuJoCo's 9-DoF Panda state through the stable 8-channel API."""
        qpos = self._home_qpos if home else self.data.qpos
        joints = qpos[self._joint_qpos_addresses].copy()
        gripper = qpos[self._finger_qpos_addresses].sum(axis=1, keepdims=True)
        return np.concatenate((joints, gripper), axis=1)

    def get_state(self) -> ScenarioState:
        return ScenarioState(
            qpos=self.data.qpos.copy(),
            qvel=self.data.qvel.copy(),
            ctrl=self.data.ctrl.copy(),
            qacc_warmstart=self.data.qacc_warmstart.copy(),
            time=float(self.data.time),
            phase=self._phase,
            step_count=self._step_count,
            prng_state=copy.deepcopy(self._rng.bit_generator.state),
            object_pose=self._object_pose.copy(),
            custody=copy.deepcopy(self._custody),
            locks=copy.deepcopy(self._locks),
            tools=copy.deepcopy(self._tools),
            business_fault_count=self._business_fault_count,
            timers=copy.deepcopy(self._timers),
            trace=tuple(self._trace),
            task_state=copy.deepcopy(self._get_task_state()),
        )

    def set_state(self, state: ScenarioState) -> None:
        if state.qpos.shape != self.data.qpos.shape or state.qvel.shape != self.data.qvel.shape:
            raise ValueError("ScenarioState physics dimensions do not match this environment")
        self.data.qpos[:] = state.qpos
        self.data.qvel[:] = state.qvel
        self.data.ctrl[:] = state.ctrl
        self.data.time = state.time
        self._phase = state.phase
        self._step_count = state.step_count
        self._object_pose = state.object_pose.copy()
        self._custody = dict(state.custody)
        self._locks = dict(state.locks)
        self._tools = dict(state.tools)
        self._business_fault_count = state.business_fault_count
        self._timers = dict(state.timers)
        self._trace = list(state.trace)
        self._rng = np.random.default_rng()
        self._rng.bit_generator.state = copy.deepcopy(state.prng_state)
        self._set_task_state(copy.deepcopy(state.task_state))
        mujoco.mj_forward(self.model, self.data)
        self.data.qacc_warmstart[:] = state.qacc_warmstart

    def oracle(self) -> OracleResult:
        return OracleResult(success=False, predicates={"base_task_complete": False}, metrics={"elapsed_seconds": float(self.data.time)})

    def _reset_task_state(self, options: dict[str, Any]) -> None:
        del options

    def _after_physics_step(self, action: NDArray[np.float64]) -> None:
        del action

    def _get_task_state(self) -> dict[str, Any]:
        return {}

    def _set_task_state(self, task_state: dict[str, Any]) -> None:
        if task_state:
            raise ValueError("base environment does not accept task-specific state")

    def render(self) -> NDArray[np.uint8] | None:
        if self.render_mode != "rgb_array":
            return None
        if self._renderer is None:
            self._renderer = mujoco.Renderer(self.model, height=480, width=640)
        self._renderer.update_scene(self.data, camera="overview")
        return self._renderer.render().copy()

    def close(self) -> None:
        if self._renderer is not None:
            self._renderer.close()
            self._renderer = None

    @staticmethod
    def _event(kind: str, payload: dict[str, Any]) -> str:
        return json.dumps({"kind": kind, **payload}, sort_keys=True, separators=(",", ":"), allow_nan=False)
