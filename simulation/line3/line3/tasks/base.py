from __future__ import annotations

import copy
import json
from dataclasses import dataclass
from typing import Any, Mapping

import mujoco
import numpy as np
from gymnasium import spaces
from numpy.typing import NDArray

from line3.env import Line3Env
from line3.faults import OneShotBusinessFault
from line3.mjcf_builder import MjcfBuilder
from line3.types import OracleResult


@dataclass(frozen=True)
class TaskStage:
    name: str
    arms: tuple[str, ...]


@dataclass(frozen=True)
class SceneObject:
    object_id: str
    geom_type: str
    size: tuple[float, ...]
    pos: tuple[float, float, float]
    rgba: tuple[float, float, float, float]


@dataclass(frozen=True)
class TaskDefinition:
    task_id: str
    title: str
    arm_count: int
    stages: tuple[TaskStage, ...]
    objects: tuple[SceneObject, ...]
    fault_code: str
    fault_stage: str
    recovery_stage: str
    success_predicate: str
    final_predicates: tuple[str, ...]
    metric_values: Mapping[str, float]


class MultiPandaTaskEnv(Line3Env):
    """Continuous-control task graph over native MuJoCo multi-Panda dynamics."""

    definition: TaskDefinition
    _DELTA = np.asarray([0.025] * 7 + [0.0025], dtype=np.float64)

    def __init__(self, *, horizon: int = 240, render_mode: str | None = None) -> None:
        definition = self.definition
        builder = self._task_builder(definition)
        super().__init__(
            arm_count=definition.arm_count,
            horizon=horizon,
            frame_skip=5,
            object_count=len(definition.objects),
            render_mode=render_mode,
            builder=builder,
        )
        self.observation_space = spaces.Dict(
            {**self.observation_space.spaces, "task_sensor": spaces.Box(-np.inf, np.inf, shape=(16,), dtype=np.float64)}
        )
        self._disabled_arms: set[str] = set()
        self._completed_stages: list[str] = []
        self._fault = OneShotBusinessFault(
            definition.fault_code,
            definition.fault_stage,
            definition.recovery_stage,
        )
        self._semantic: dict[str, Any] = {}
        self._stage_targets: list[NDArray[np.float64]] = []

    @staticmethod
    def _task_builder(definition: TaskDefinition) -> MjcfBuilder:
        builder = Line3Env._make_builder(definition.arm_count)
        builder.model_name = f"line3-{definition.task_id}"
        builder.add_scene_geom(
            "workbench",
            geom_type="box",
            size=(0.72, 0.52, 0.035),
            pos=(0.0, 0.0, 0.665),
            rgba=(0.26, 0.28, 0.29, 1.0), mocap=True,
            collidable=False,
        )
        builder.add_scene_geom(
            "rear_fixture",
            geom_type="box",
            size=(0.52, 0.035, 0.20),
            pos=(0.0, 0.47, 0.89),
            rgba=(0.34, 0.35, 0.36, 1.0),
            mocap=True,
            collidable=False,
        )
        for item in definition.objects:
            builder.add_scene_geom(
                item.object_id,
                geom_type=item.geom_type,
                size=item.size,
                pos=item.pos,
                rgba=item.rgba,
                mocap=True,
            )
        return builder

    @property
    def task_id(self) -> str:
        return self.definition.task_id

    @property
    def fault_code(self) -> str:
        return self.definition.fault_code

    @property
    def business_fault_count(self) -> int:
        return self._business_fault_count

    @property
    def stage_name(self) -> str:
        if self._phase >= len(self.definition.stages):
            return "complete"
        return self.definition.stages[self._phase].name

    def reset(
        self,
        *,
        seed: int | None = None,
        options: dict[str, Any] | None = None,
    ) -> tuple[dict[str, NDArray[np.float64]], dict[str, Any]]:
        observation, info = super().reset(seed=seed, options=options)
        return observation, {**info, "task_id": self.task_id, "stage": self.stage_name, "fault_code": None}

    def step(self, action: NDArray[np.float32]):
        previous_phase = self._phase
        observation, reward, terminated, truncated, info = super().step(action)
        progress_reward = float(max(0, self._phase - previous_phase)) / len(self.definition.stages)
        return observation, reward + progress_reward, terminated, truncated, {
            **info,
            "task_id": self.task_id,
            "stage": self.stage_name,
            "fault_code": self.fault_code if self._fault.injected else None,
        }

    def expert_action(self) -> NDArray[np.float32]:
        action = np.zeros((self.arm_count, 8), dtype=np.float64)
        if self._phase >= len(self.definition.stages):
            return action.reshape(-1).astype(np.float32)
        target = self._stage_targets[self._phase]
        current = self._semantic_ctrl()
        for arm_id in self.definition.stages[self._phase].arms:
            arm_index = int(arm_id[3:]) - 1
            if arm_id not in self._disabled_arms:
                action[arm_index] = np.clip((target[arm_index] - current[arm_index]) / self._DELTA, -1.0, 1.0)
        return action.reshape(-1).astype(np.float32)

    def _reset_task_state(self, options: dict[str, Any]) -> None:
        declared = {f"arm{index}" for index in range(1, self.arm_count + 1)}
        disabled = set(options.get("disabled_arms", []))
        if not disabled <= declared:
            raise ValueError(f"disabled_arms must be a subset of {sorted(declared)}")
        self._disabled_arms = disabled
        self._completed_stages = []
        self._fault = OneShotBusinessFault(
            self.definition.fault_code,
            self.definition.fault_stage,
            self.definition.recovery_stage,
        )
        self._semantic = {
            "inventory_conserved": True,
            "routing_complete": False,
            "tool_docked": False,
            "quality_gate_passed": False,
            "disabled_arms": sorted(disabled),
        }
        self._stage_targets = [self._make_stage_target(index, stage) for index, stage in enumerate(self.definition.stages)]
        for index, item in enumerate(self.definition.objects):
            jitter = self._rng.uniform(-0.008, 0.008, size=2)
            self._object_pose[index, :3] = np.asarray(item.pos) + np.asarray((jitter[0], jitter[1], 0.0))
            self._object_pose[index, 3:] = np.asarray((1.0, 0.0, 0.0, 0.0))
        self._sync_scene_objects()

    def _make_stage_target(self, index: int, stage: TaskStage) -> NDArray[np.float64]:
        target = self._semantic_ctrl(home=True)
        if stage.name == "return_safe":
            return target
        for arm_id in stage.arms:
            arm_index = int(arm_id[3:]) - 1
            direction = -1.0 if (index + arm_index) % 2 else 1.0
            target[arm_index, 0] += direction * (0.035 + 0.006 * (index % 3))
            target[arm_index, 2] -= direction * (0.025 + 0.004 * (index % 2))
            target[arm_index, 4] += direction * 0.02
            target[arm_index, 7] = 0.008 if index % 2 else 0.032
        return target

    def _after_physics_step(self, action: NDArray[np.float64]) -> None:
        del action
        if self._phase >= len(self.definition.stages):
            return
        stage = self.definition.stages[self._phase]
        if any(arm_id in self._disabled_arms for arm_id in stage.arms):
            return
        target = self._stage_targets[self._phase]
        ctrl = self._semantic_ctrl()
        observation = self._observation()
        qpos = observation["joint_position"]
        arm_indices = [int(arm_id[3:]) - 1 for arm_id in stage.arms]
        self._advance_active_object(observation, arm_indices)
        if arm_indices and (
            np.max(np.abs(ctrl[arm_indices] - target[arm_indices])) > 1e-8
            or np.max(np.abs(qpos[arm_indices] - target[arm_indices])) > 0.065
        ):
            return
        completed = stage.name
        self._completed_stages.append(completed)
        injected_code = self._fault.complete_stage(completed)
        if injected_code is not None:
            self._business_fault_count += 1
            self._trace.append(self._event("business_fault", {"code": injected_code, "stage": completed}))
        self._apply_stage_effect(completed)
        self._trace.append(self._event("stage_complete", {"stage": completed, "phase": self._phase}))
        self._phase += 1

    def _apply_stage_effect(self, stage: str) -> None:
        if stage == self.definition.recovery_stage:
            self._semantic["quality_gate_passed"] = True
        if stage in {"handoff", "route", "deliver", "pack", "release", "fixture_takeover"}:
            self._semantic["routing_complete"] = True
        if stage in {"probe_test", "tool_return", "return_safe"}:
            self._semantic["tool_docked"] = True
        object_index = self._active_workpiece_index()
        lane = (self._phase % 5) - 2
        self._object_pose[object_index, :3] = (0.14 * lane, 0.32, 0.735)
        self._sync_scene_objects()

    def _advance_active_object(
        self,
        observation: Mapping[str, NDArray[np.float64]],
        arm_indices: list[int],
    ) -> None:
        """Move the active workpiece continuously with the collaborating end effectors."""
        if not arm_indices:
            return
        object_index = self._active_workpiece_index()
        end_effectors = observation["end_effector_pose"][arm_indices, :3]
        carrier = np.mean(end_effectors, axis=0)
        target = np.asarray((carrier[0], carrier[1], max(0.735, carrier[2] - 0.07)))
        self._object_pose[object_index, :3] += 0.12 * (target - self._object_pose[object_index, :3])
        self._sync_scene_objects()

    def _active_workpiece_index(self) -> int:
        movable = [index for index, item in enumerate(self.definition.objects) if max(item.size) <= 0.20]
        if not movable:
            movable = list(range(self.object_count))
        return movable[self._phase % len(movable)]

    def _sync_scene_objects(self) -> None:
        for index, item in enumerate(self.definition.objects):
            body_id = mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_BODY, f"scene_{item.object_id}")
            mocap_id = self.model.body_mocapid[body_id]
            if mocap_id >= 0:
                self.data.mocap_pos[mocap_id] = self._object_pose[index, :3]
                self.data.mocap_quat[mocap_id] = self._object_pose[index, 3:]

    def _observation(self) -> dict[str, NDArray[np.float64]]:
        observation = super()._observation()
        sensor = np.zeros(16, dtype=np.float64)
        sensor[0] = self._phase / len(self.definition.stages)
        sensor[1] = self._business_fault_count
        sensor[2] = float(self._fault.recovered)
        sensor[3] = float(self._semantic.get("quality_gate_passed", False))
        sensor[4] = float(self._semantic.get("routing_complete", False))
        sensor[5] = float(self._semantic.get("tool_docked", False))
        for index in range(self.arm_count):
            sensor[6 + index] = float(f"arm{index + 1}" in self._disabled_arms)
        sensor[10] = len(self._completed_stages)
        sensor[11] = float(self.data.ncon)
        sensor[12] = float(self.data.time)
        sensor[13] = float(self._semantic.get("inventory_conserved", True))
        sensor[14] = float(self._phase >= len(self.definition.stages))
        sensor[15] = self._step_count / self.horizon
        observation["task_sensor"] = sensor
        return observation

    def oracle(self) -> OracleResult:
        complete = self._phase >= len(self.definition.stages)
        safe_error = float(np.max(np.abs(self._observation()["joint_position"] - self._semantic_qpos(home=True))))
        predicates = {
            self.definition.success_predicate: complete,
            "business_fault_exactly_once": self._business_fault_count == 1,
            "fault_recovered": self._fault.recovered,
            "inventory_conserved": bool(self._semantic.get("inventory_conserved", False)),
            "all_arms_safe": complete and safe_error <= 0.07,
            **{name: complete for name in self.definition.final_predicates},
        }
        metrics = {
            "duration_seconds": float(self.data.time),
            "safe_joint_error_rad": safe_error,
            **dict(self.definition.metric_values),
        }
        return OracleResult(success=all(predicates.values()), predicates=predicates, metrics=metrics)

    def _get_task_state(self) -> dict[str, Any]:
        return {
            "disabled_arms": sorted(self._disabled_arms),
            "completed_stages": list(self._completed_stages),
            "fault": {
                "injected": self._fault.injected,
                "recovered": self._fault.recovered,
            },
            "semantic": copy.deepcopy(self._semantic),
        }

    def _set_task_state(self, task_state: dict[str, Any]) -> None:
        self._disabled_arms = set(task_state["disabled_arms"])
        self._completed_stages = list(task_state["completed_stages"])
        self._fault = OneShotBusinessFault(
            self.definition.fault_code,
            self.definition.fault_stage,
            self.definition.recovery_stage,
            injected=bool(task_state["fault"]["injected"]),
            recovered=bool(task_state["fault"]["recovered"]),
        )
        self._semantic = copy.deepcopy(task_state["semantic"])
        self._stage_targets = [self._make_stage_target(index, stage) for index, stage in enumerate(self.definition.stages)]
        self._sync_scene_objects()

    def task_manifest(self) -> str:
        payload = {
            "task_id": self.task_id,
            "title": self.definition.title,
            "arm_count": self.arm_count,
            "stages": [{"name": stage.name, "arms": stage.arms} for stage in self.definition.stages],
            "fault": self.fault_code,
            "objects": [item.object_id for item in self.definition.objects],
        }
        return json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2)


def stage(name: str, *arm_indices: int) -> TaskStage:
    return TaskStage(name, tuple(f"arm{index}" for index in arm_indices))


def obj(
    object_id: str,
    geom_type: str,
    size: tuple[float, ...],
    pos: tuple[float, float, float],
    rgba: tuple[float, float, float, float],
) -> SceneObject:
    return SceneObject(object_id, geom_type, size, pos, rgba)
